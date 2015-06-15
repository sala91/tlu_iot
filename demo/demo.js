// 
// Here is how to define your module 
// has dependent on mobile-angular-ui
// 
var app = angular.module('MobileAngularUiExamples', [
  'ngRoute',
  'mobile-angular-ui',
  'angularNumberPicker',
  'chart.js',


  // touch/drag feature: this is from 'mobile-angular-ui.gestures.js'
  // it is at a very beginning stage, so please be careful if you like to use
  // in production. This is intended to provide a flexible, integrated and and 
  // easy to use alternative to other 3rd party libs like hammer.js, with the
  // final pourpose to integrate gestures into default ui interactions like 
  // opening sidebars, turning switches on/off ..
  'mobile-angular-ui.gestures',
  'azure-mobile-service.module'
]);

app.constant('AzureMobileServiceClient', {
    API_URL: 'https://tluiot.azure-mobile.net/',
    API_KEY: 'emtMObLICkvMeJWizeReyDZQIchRoa78'
});

// 
// You can configure ngRoute as always, but to take advantage of SharedState location
// feature (i.e. close sidebar on backbutton) you should setup 'reloadOnSearch: false' 
// in order to avoid unwanted routing.
// 
app.config(function ($routeProvider) {
    $routeProvider.when('/', { templateUrl: 'forms.html',controller:'login', reloadOnSearch: false });
    $routeProvider.when('/home', { templateUrl: 'home.html', reloadOnSearch: false });
    $routeProvider.when('/newplant', { templateUrl: 'newplant.html', controller: 'newplant', reloadOnSearch: false });
    $routeProvider.when('/profile', { templateUrl: 'profile.html', reloadOnSearch: false });
    $routeProvider.when('/plantDetail', { templateUrl: 'plantDetail.html', reloadOnSearch: false });
    $routeProvider.when('/plantslist', {
        templateUrl: 'plantslist.html',
        controller: 'plantslist',
        reloadOnSearch: false,
        resolve: {
            'plants': function (Azureservice) {
                return Azureservice.getAll('plant');
            }
        }
    });
    $routeProvider.when('/badgeslist', { templateUrl: 'badgeslist.html', reloadOnSearch: false });

});



app.controller('plantslist', function ($scope, plants) {
    $scope.plants = plants;
});

app.controller('newplant', function ($scope, $rootScope, $location, Azureservice) {
    var formModel = {
        name: 'test',
        raspberry_id: 'pID1',
        humidity: '',
        min_number: 5,
        max_temp: 10,
        'private': '',
        about: 'Test string'
    };

    $scope.formModel = formModel;

    $scope.sendForm = function () {
        $rootScope.loading = true;
        Azureservice.insert('plant', $scope.formModel).then(function () {
            $location.path('/plantslist');
            $rootScope.loading = false;
        });
    };
});

//
// For this trivial demo we have just a unique MainController 
// for everything
//
app.controller('MainController', function ($rootScope, $scope, $route, Azureservice) {
    /*
    if (!Azureservice.isLoggedIn()) {
        Azureservice.login('google').then(function () {
            $route.reload();
        });
        console.log('Logged user in');
    } else {
        console.log('Used already logged in');
    }
    // User agent displayed in home page
    $scope.userAgent = navigator.userAgent;

    */

    // Needed for the loading screen
    $rootScope.$on('$routeChangeStart', function () {
        $rootScope.loading = true;
    });

    $rootScope.$on('$routeChangeSuccess', function () {
        $rootScope.loading = false;
    });

 



    //
    // 'Forms' screen
    //  
    $scope.rememberMe = true;
    $scope.email = 'me@example.com';

    $scope.login = function () {

        alert('You submitted the login form');
    };


});





//	Graafik

app.controller("LineCtrl", function ($scope) {

    $scope.labels = ["Mon", "Tue", "Wed", "Thur", "Fri", "Sat", "Sun"];
    $scope.series = ['Temp', 'Humidity', 'Sunlight'];
    $scope.data = [
      [90, 87, 93, 75, 60, 57, 55],
      [55, 66, 33, 99, 22, 44, 35],
      [66, 33, 39, 42, 49, 22, 87],
    ];

});

app.controller('login', function ($rootScope, $scope, $route, Azureservice) {
    
    if (!Azureservice.isLoggedIn()) {
        Azureservice.login('google').then(function () {
            $route.reload();
        });
        console.log('from login controller');
    } else {
        console.log('User already logged in from login controller');
    }
    // User agent displayed in home page
    $scope.userAgent = navigator.userAgent;



    // Needed for the loading screen
    $rootScope.$on('$routeChangeStart', function () {
        $rootScope.loading = true;
    });

    $rootScope.$on('$routeChangeSuccess', function () {
        $rootScope.loading = false;
    });
    
});