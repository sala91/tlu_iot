// 
// Here is how to define your module 
// has dependent on mobile-angular-ui
// 
var app = angular.module('MobileAngularUiExamples', [
  'ngRoute',
  
  'angularNumberPicker',
  'chart.js',
  'azure-mobile-service.module',
  'mobile-angular-ui.gestures',
  'mobile-angular-ui',
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
    $routeProvider.when('/',    { templateUrl: '/templates/forms.html',controller:'login', reloadOnSearch: false });
    $routeProvider.when('/home', { templateUrl: '/templates/home.html', reloadOnSearch: false });
    $routeProvider.when('/profile', { templateUrl: '/templates/profile.html', reloadOnSearch: false });
    $routeProvider.when('/newplant', { templateUrl: '/templates/newplant.html', controller: 'newplant', reloadOnSearch: false });
    $routeProvider.when('/badgeslist', { templateUrl: '/templates/badgeslist.html', controller: '', reloadOnSearch: false });
    $routeProvider.when('/plantDetail', { templateUrl: '/templates/plantDetail.html', reloadOnSearch: false });
    $routeProvider.when('/plantslist', {
        templateUrl: '/templates/plantslist.html',
        controller: 'plantslist',
        reloadOnSearch: false,
        resolve: {
            'plants': function (Azureservice) {
                return Azureservice.getAll('plant');
            }
        }
    });

    $routeProvider.when('/home', {
        templateUrl: '/templates/home.html',
        reloadOnSearch: false,
        controller: 'chartCtrl',
        resolve: {
            'plantCount': function (Azureservice) {
                return Azureservice.getAll('plant');
            }
        }
    });

    $routeProvider.when('/editplant', {
        templateUrl: '/templates/editplant.html',
        controller: 'editplant',
        reloadOnSearch: false,
        resolve: {
            // Peaks saama vastava ID'ga sissekande
            'selected': function (Azureservice) {
                //return Azureservice.getById('plant', 'EC39D65F-8916-4B47-8724-7ECCDFB9B521');
                return Azureservice.getAll('plant');
            }
        }
    });

});

app.controller('editplant', function ($scope, $rootScope, $location, Azureservice, selected) {
    $scope.selected = selected;

    var newFormModel = {
        id: 'EC39D65F-8916-4B47-8724-7ECCDFB9B521',
        name: selected.name,
        raspberry_id: selected.raspberry_id,
        humidity: selected.humidity,
        min_number: selected.min_number,
        max_temp: selected.max_number,
        'private': selected.private,
        about: selected.about
    };

    var object = document.getElementById('');

    $scope.newFormModel = newFormModel;

    $scope.editForm = function () {
        $rootScope.loading = true;
        Azureservice.update('plant', $scope.newFormModel).then(function () {
            // Suunab tagasi "/plantslist"
            $location.path('/plantslist');
            $rootScope.loading = false;
        });
    };
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
    app.controller('MainController', function ($rootScope, $scope, $route, $location, Azureservice) {
        // Needed for the loading screen
        $rootScope.$on('$routeChangeStart', function () {
            $rootScope.loading = true;
        });

        $rootScope.$on('$routeChangeSuccess', function () {
            $rootScope.loading = false;
        });

 
        // Logoff feature
        $scope.logoff = function () {
            Azureservice.logout();
            $location.path('/');
        }

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
            [0, 0, 0, 0, 0, 0, 0],
            [5, 5, 5, 5, 5, 5, 5],
            [10, 10, 10, 10, 10, 10, 10]
        ];

    });

    app.controller('chartCtrl', function ($scope, plantCount) {
        $scope.plantCount = plantCount;
    });

    // Login controller
    app.controller('login', function ($rootScope, $scope, $route, Azureservice, $location) {
        if (!Azureservice.isLoggedIn()) {
            $scope.loginfb = function () {
                Azureservice.login('facebook').then(function () {
                    $route.reload();
                    console.log('from login controller');
                })
            }

            $scope.logingo = function () {
                Azureservice.login('google').then(function () {
                    $route.reload();
                    console.log('from login controller');
                })
            }
        } else {
            $location.path('/plantslist');
        }
    });