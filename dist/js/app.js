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
    $routeProvider.when('/', { templateUrl: '/templates/forms.html',controller:'login', reloadOnSearch: false });
    $routeProvider.when('/home', { templateUrl: '/templates/home.html', reloadOnSearch: false, });
    $routeProvider.when('/profile', { templateUrl: '/templates/profile.html',
        reloadOnSearch: false,
        controller: 'getuser',
        resolve: {
            'user': function (Azureservice) {
                return Azureservice.getAll('users');
            }
        }
    });
    $routeProvider.when('/newplant', { templateUrl: '/templates/newplant.html', controller: 'newplant', reloadOnSearch: false });
    $routeProvider.when('/badgeslist', { templateUrl: '/templates/badgeslist.html', controller: '', reloadOnSearch: false });
    $routeProvider.when('/plantDetail', { templateUrl: '/templates/plantDetail.html', reloadOnSearch: false });
    $routeProvider.when('/newuser', {
        templateUrl: 'templates/newuser.html',
        controller: 'newuser',
        reloadOnSearch: false,
        resolve: {
            'user': function (Azureservice) {
                return Azureservice.getAll('users');
            }
        }
    });
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

    $routeProvider.when('/plantDetail', {
        templateUrl: '/templates/plantDetail.html',
        reloadOnSearch: false,
        controller: 'pdetail',
        resolve: {
            'plantdetail': function (Azureservice) {
                return Azureservice.getById('plant', '0F55FE1F-B5FC-449A-AAF1-74FF4F1E4449');
            }
        }
    });

    // Proov taimede informatsiooni kuvamiseks
    $routeProvider.when('/plantinfo', {
        templateUrl: '/templates/plantinfo.html',
        controller: 'plantinfo',
        reloadOnSearch: false,
        resolve: {
            'plants': function (Azureservice) {
                return Azureservice.getAll('plant');
            }
        }
    });

});

app.controller('pdetail', function ($scope, plantdetail) {
    $scope.plantdetail = plantdetail;

    //  Graafikud
    $scope.labels = ["Mon", "Tue", "Wed", "Thur", "Fri", "Sat", "Sun"];
    $scope.series = ['Temp'];
    $scope.data = [
        [10, 14, 8, 10, 17, 21, 16],
    ];
});

// Mingi controller 'plantinfo' proovimiseks
app.controller('plantinfo', function ($scope, plants) {
    $scope.plants = plants;
});

app.controller('plantslist', function ($scope, plants) {
    $scope.plants = plants;
});

// controller to add data if user log\s in first time
app.controller('newuser', function ($scope, $rootScope, $location, Azureservice, user) {
   
    try {
        if (user[0].name !== undefined) {
            $location.path('/profile');
            $rootScope.loading = false;
        } 
        throw "TypeError"; //user[0].name gives type error if no data is received from azure
             
    }
    catch (e) {
        // statements to handle any exceptions
        var userModel = {
            email: 'email',
            name: 'name',
            phone: 'number',

        };
        $scope.userModel = userModel;
        $scope.sendUser = function () {
            $rootScope.loading = true;
            Azureservice.insert('users', $scope.userModel).then(function () {
                $location.path('/profile');
                $rootScope.loading = false;
            });
        }
    }
});
// get user data not working yet
app.controller('getuser', function ($scope, user) {
    console.log(user[0].name);
    var userModel = {
        email: 'email',
        name: 'name',
        phone: 'number',

    };
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
    /*
    //
    // 'Forms' screen  VIST EI KASUTA ENAM AGA POLE 100% KINDEL VEEL
    //  
    $scope.rememberMe = true;
    $scope.email = 'me@example.com';

    $scope.login = function () {

        alert('You submitted the login form');
    };
    */
});


//	Graafik
app.controller("LineCtrl", function ($scope) {

    $scope.labels = ["Mon", "Tue", "Wed", "Thur", "Fri", "Sat", "Sun"];
    $scope.series = ['Temp', 'Humidity', 'Sunlight'];
    $scope.data = [
        [0, 0, 0, 10, 0, 5, 0],
        [5, 5, 5, 5, 5, 10, 5],
        [10, 10, 2, 10, 10, 0, 10]
    ];

});

app.controller('chartCtrl', function ($scope, plantCount) {
    $scope.plantCount = plantCount;
});

// Login controller
app.controller('login', function ($rootScope, $scope, $route, Azureservice, $location) {
    console.log("Login controller");
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
        $location.path('/newuser');
        }
     
});