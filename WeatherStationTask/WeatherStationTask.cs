﻿using System;
using System.Collections.Generic;
using System.IO;
using System.Runtime.InteropServices.WindowsRuntime;
using System.Runtime.Serialization.Json;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Xml;
using System.Xml.Serialization;
using Windows.ApplicationModel.Background;
using Windows.Networking.Sockets;
using Windows.Storage;
using Windows.Storage.Streams;
using Windows.System.Threading;

using WeatherStationTask.Sparkfun;

namespace WeatherStationTask
{
    public sealed class WeatherData
    {
        public WeatherData()
        {
            TimeStamp = DateTimeOffset.Now.ToLocalTime().ToString();
        }

        public string TimeStamp { get; set; }
        public float Altitude { get; set; }
        public float CelsiusTemperature { get; set; }
        public float FahrenheitTemperature { get; set; }
        public float Humidity { get; set; }
        public float BarometricPressure { get; set; }

        public string JSON
        {
            get
            {
                var jsonSerializer = new DataContractJsonSerializer(typeof(WeatherData));
                using (MemoryStream strm = new MemoryStream())
                {
                    jsonSerializer.WriteObject(strm, this);
                    byte[] buf = strm.ToArray();
                    return Encoding.UTF8.GetString(buf, 0, buf.Length);
                }
            }
        }

        public string XML
        {
            get
            {
                var xmlserializer = new XmlSerializer(typeof(WeatherData));
                var stringWriter = new StringWriter();
                using (var writer = XmlWriter.Create(stringWriter))
                {
                    xmlserializer.Serialize(writer, this, new XmlSerializerNamespaces());
                    return stringWriter.ToString();
                }
            }
        }

        public string HTML
        {
            get
            {
                return string.Format(@"<html><head><title>My Weather Station</title></head><body>
                                    Time:{0}<br />
                                    Temperature (C/F): {1:N2}/{2:N2}<br />
                                    Barometric Pressure (kPa): {3:N4}<br />
                                    Relative Humidity (%): {4:N2}<br /></body></html>",
                                    TimeStamp, CelsiusTemperature, FahrenheitTemperature, (BarometricPressure / 1000), Humidity);
            }
        }
    }

    public sealed partial class ServerTask : IBackgroundTask
    {
        private BackgroundTaskDeferral taskDeferral;
        private ThreadPoolTimer i2cTimer;
        private HttpServer server;
        private readonly int port = 50001;
        private WeatherData weatherData = new WeatherData();
        private readonly int i2cReadIntervalSeconds = 2;
        private WeatherShield shield = new WeatherShield();
        private Mutex mutex;
        private string mutexId = "WeatherStation";

        // Hard coding guid for sensors. Not an issue for this particular application which is meant for testing and demos
        private List<ConnectTheDotsSensor> sensors = new List<ConnectTheDotsSensor> {
            new ConnectTheDotsSensor("2298a348-e2f9-4438-ab23-82a3930662ab", "Altitude", "m"),
            new ConnectTheDotsSensor("2298a348-e2f9-4438-ab23-82a3930662ac", "Humidity", "%RH"),
            new ConnectTheDotsSensor("2298a348-e2f9-4438-ab23-82a3930662ad", "Pressure", "kPa"),
            new ConnectTheDotsSensor("2298a348-e2f9-4438-ab23-82a3930662ae", "Temperature", "C"),
        };

        public async void Run(IBackgroundTaskInstance taskInstance)
        {
            // Ensure our background task remains running
            taskDeferral = taskInstance.GetDeferral();

            // Mutex will be used to ensure only one thread at a time is talking to the shield / isolated storage
            mutex = new Mutex(false, mutexId);

            // Initialize ConnectTheDots Settings
            localSettings.ServicebusNamespace = "iotbuildlab-ns";
            localSettings.EventHubName = "ehdevices";
            localSettings.KeyName = "D1";
            localSettings.Key = "iQFNbyWTYRBwypMtPmpfJVz+NBgR32YHrQC0ZSvId20=";
            localSettings.DisplayName = "WeatherStation1";
            localSettings.Organization = "IoT Build Lab";
            localSettings.Location = "USA";

            SaveSettings();

            // Initialize WeatherShield
            await shield.BeginAsync();

            // Create a timer-initiated ThreadPool task to read data from I2C
            i2cTimer = ThreadPoolTimer.CreatePeriodicTimer(PopulateWeatherData, TimeSpan.FromSeconds(i2cReadIntervalSeconds));

            // Start the server
            server = new HttpServer(port);
            var asyncAction = ThreadPool.RunAsync((w) => { server.StartServer(weatherData); });

            // Task cancellation handler, release our deferral there 
            taskInstance.Canceled += OnCanceled;
        }

        private void PopulateWeatherData(ThreadPoolTimer timer)
        {
            bool hasMutex = false;

            try
            {
                hasMutex = mutex.WaitOne(1000);
                if (hasMutex)
                {
                    weatherData.TimeStamp = DateTime.Now.ToLocalTime().ToString();

                    shield.BlueLEDPin.Write(Windows.Devices.Gpio.GpioPinValue.High);

                    weatherData.Altitude = shield.Altitude;
                    weatherData.BarometricPressure = shield.Pressure;
                    weatherData.CelsiusTemperature = shield.Temperature;
                    weatherData.FahrenheitTemperature = (weatherData.CelsiusTemperature * 9 / 5) + 32;
                    weatherData.Humidity = shield.Humidity;

                    shield.BlueLEDPin.Write(Windows.Devices.Gpio.GpioPinValue.Low);

                    // Push the WeatherData local/cloud storage (viewable at http://iotbuildlab.azurewebsites.net/)
                    WriteDataToIsolatedStorage();
                    SendDataToConnectTheDots();
                }
            }
            finally
            {
                if (hasMutex)
                {
                    mutex.ReleaseMutex();
                }
            }
        }

        async private void WriteDataToIsolatedStorage()
        {
            // We have exlusive access to the mutex so can safely wipe the transfer file
            Windows.Globalization.DateTimeFormatting.DateTimeFormatter formatter = new Windows.Globalization.DateTimeFormatting.DateTimeFormatter("longtime");
            StorageFolder localFolder = ApplicationData.Current.LocalFolder;
            StorageFile transferFile = await localFolder.CreateFileAsync("DataFile.txt", CreationCollisionOption.ReplaceExisting);

            using (var stream = await transferFile.OpenStreamForWriteAsync())
            {
                StreamWriter writer = new StreamWriter(stream);

                writer.WriteLine(weatherData.TimeStamp);
                writer.WriteLine(weatherData.Altitude.ToString());
                writer.WriteLine(weatherData.BarometricPressure.ToString());
                writer.WriteLine(weatherData.CelsiusTemperature.ToString());
                writer.WriteLine(weatherData.FahrenheitTemperature.ToString());
                writer.WriteLine(weatherData.Humidity.ToString());
                writer.Flush();
            }
        }

        private void SendDataToConnectTheDots()
        {
            ConnectTheDotsSensor sensor;
            string time = DateTime.UtcNow.ToString("o");

            // Send the altitude data
            sensor = sensors.Find(item => item.measurename == "Altitude");
            if (sensor != null)
            {
                sensor.value = weatherData.Altitude;
                sensor.timecreated = time;
                sendMessage(sensor.ToJson());
            }

            // Send the humidity data
            sensor = sensors.Find(item => item.measurename == "Humidity");
            if (sensor != null)
            {
                sensor.value = weatherData.Humidity;
                sensor.timecreated = time;
                sendMessage(sensor.ToJson());
            }

            // Sending the pressure data
            sensor = sensors.Find(item => item.measurename == "Pressure");
            if (sensor != null)
            {
                sensor.value = (weatherData.BarometricPressure / 1000);
                sensor.timecreated = time;
                sendMessage(sensor.ToJson());
            }

            // Sending the temperature data
            sensor = sensors.Find(item => item.measurename == "Temperature");
            if (sensor != null)
            {
                sensor.value = weatherData.CelsiusTemperature;
                sensor.timecreated = time;
                sendMessage(sensor.ToJson());
            }
        }

        private void OnCanceled(IBackgroundTaskInstance sender, BackgroundTaskCancellationReason reason)
        {
            // Relinquish our task deferral
            taskDeferral.Complete();
        }
    }

    public sealed class HttpServer : IDisposable
    {
        private const uint bufLen = 8192;
        private int defaultPort = 50001;
        private readonly StreamSocketListener sock;
        private WeatherData weatherData;

        public HttpServer(int serverPort)
        {
            sock = new StreamSocketListener();
            defaultPort = serverPort;
            sock.ConnectionReceived += (s, e) => ProcessRequestAsync(e.Socket);
        }

        public async void StartServer(WeatherData w)
        {
            await sock.BindServiceNameAsync(defaultPort.ToString());
            weatherData = w;
        }

        private async void ProcessRequestAsync(StreamSocket socket)
        {
            // Read in the HTTP request, we only care about type 'GET'
            StringBuilder request = new StringBuilder();
            using (IInputStream input = socket.InputStream)
            {
                byte[] data = new byte[bufLen];
                IBuffer buffer = data.AsBuffer();
                uint dataRead = bufLen;
                while (dataRead == bufLen)
                {
                    await input.ReadAsync(buffer, bufLen, InputStreamOptions.Partial);
                    request.Append(Encoding.UTF8.GetString(data, 0, data.Length));
                    dataRead = buffer.Length;
                }
            }

            using (IOutputStream output = socket.OutputStream)
            {
                string requestMethod = request.ToString().Split('\n')[0];
                string[] requestParts = requestMethod.Split(' ');
                await WriteResponseAsync(requestParts, output);
            }
        }

        private async Task WriteResponseAsync(string[] requestTokens, IOutputStream outstream)
        {
            // NOTE: If you change the respBody format, change the Content-Type (below) accordingly
            //string respBody = weatherData.HTML;
            //string respBody = weatherData.XML;
            string respBody = weatherData.JSON;

            string htmlCode = "200 OK";

            using (Stream resp = outstream.AsStreamForWrite())
            {
                byte[] bodyArray = Encoding.UTF8.GetBytes(respBody);
                MemoryStream stream = new MemoryStream(bodyArray);

                // NOTE: If you change the respBody format (above), change the Content-Type accordingly
                string header = string.Format("HTTP/1.1 {0}\r\n" +
                                              //"Content-Type: text/html\r\n" + // HTML only
                                              //"Content-Type: text/xml\r\n" +  // XML only
                                              "Content-Type: text/json\r\n" + // JSON only
                                              "Content-Length: {1}\r\n" +
                                              "Connection: close\r\n\r\n",
                                              htmlCode, stream.Length);

                byte[] headerArray = Encoding.UTF8.GetBytes(header);
                await resp.WriteAsync(headerArray, 0, headerArray.Length);
                await stream.CopyToAsync(resp);
                await resp.FlushAsync();
            }
        }

        public void Dispose()
        {
            sock.Dispose();
        }
    }
}
