//  ID
var button_id = null;

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
    $routeProvider.when('/home', { templateUrl: '/templates/home.html', reloadOnSearch: false });
    $routeProvider.when('/profile', { templateUrl: '/templates/profile.html', reloadOnSearch: false });
    $routeProvider.when('/newplant', { templateUrl: '/templates/newplant.html', controller: 'newplant', reloadOnSearch: false });
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
            },
            'badges': function (Azureservice) {
                return Azureservice.getAll('badges');
            }
        }
    });

    $routeProvider.when('/badgeslist', {
        templateUrl: '/templates/badgeslist.html',
        controller: 'badgeController',
        reloadOnSearch: false,
        resolve: {
            'badges': function (Azureservice) {
                return Azureservice.getAll('badges');
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
                return Azureservice.getById('plant', button_id);
            }
        }
    });

    $routeProvider.when('/editplant', {
        templateUrl: '/templates/editplant.html',
        controller: 'editPlant',
        reloadOnSearch: false,
        resolve: {
            // Peaks saama vastava ID'ga sissekande
            'selected': function (Azureservice) {
                return Azureservice.getById('plant', button_id);
                //return Azureservice.getAll('plant');
            }
        }
    });

});

app.controller('pdetail', function ($scope, $rootScope, $location, Azureservice, plantdetail) {
    $scope.plantdetail = plantdetail;

    //  Graafikud
    $scope.labels = ["Mon", "Tue", "Wed", "Thur", "Fri", "Sat", "Sun"];
    $scope.series = ['Temp'];
    $scope.data = [
        [10, 14, 8, 10, 17, 21, 16],
    ];

    $scope.buttonId = function (btnId) {
        button_id = btnId;
        //console.log(button_id);
    };

});

app.controller('badgeController', function ($scope, badges) {
    $scope.badges = badges;
});

app.controller('plantslist', function ($scope, Azureservice, plants, badges) {
    $scope.plants = plants;
    $scope.badges = badges;

    $scope.buttonId = function (btnId) {
        button_id = btnId;
    };

    /* Achievement 'Your very first plant' */
    if (plants.length >= 1) {
        var exists = 0;
        for (var i = 0; i < badges.length; i++) {
            if (!badges[i].name.indexOf('Your very first plant')) {
                exists = 1;
            }
        }
        if (exists == 0) {
            Azureservice.insert('badges', { name: 'Your very first plant' }).then(function () { });
        }
    }

    /* Achievement 'PLANT PIMP' */
    if (plants.length == 5) {
        var exists = 0;
        for (var i = 0; i < badges.length; i++) {
            //console.log(badges[i].name);
            if (!badges[i].name.indexOf('PLANT PIMP')) {
                console.log('You already own the badge!');
                exists = 1;
                console.log("Exists: " + exists);
            }
        }
        if (exists == 0) {
            Azureservice.insert('badges', { name: 'PLANT PIMP' }).then(function () {
                console.log('PLANT PIMP ACHIEVED');
            });
        }
    }
});

app.controller('editPlant', function ($scope, $rootScope, $location, Azureservice, selected) {
    $scope.selected = selected;
 
    var newFormModel = {
        id: button_id,
        name: selected.name,
        raspberry_id: selected.raspberry_id,
        humidity: selected.humidity,
        min_number: selected.min_number,
        max_temp: selected.max_number,
        'private': selected.private,
        about: selected.about
    };

    $scope.newFormModel = newFormModel;
 
    $scope.editForm = function () {
        $rootScope.loading = true;
        Azureservice.update('plant', $scope.newFormModel).then(function () {
            $location.path('/plantDetail');
            $rootScope.loading = false;
        });
    };
    $scope.deletePlant = function () {
        $rootScope.loading = true;
        Azureservice.del('plant', { id: button_id }).then(function () {
            $location.path('/plantslist');
            $rootScope.loading = false;
        });
    };
});

// controller to add data if user log\s in first time
app.controller('newuser', function ($scope, $rootScope, $location, Azureservice, user) {

    try {
        console.log("Trying", (user[0].name !== undefined));
        if (user[0].name !== undefined) {
            $rootScope.loading = false;
            LoginTimeSwich();
            function LoginTimeSwich() {
                console.log("Login time switch", user[0].thislogin);
                Azureservice.update('users', {
                    id: user[0].id,
                    lastlogin: user[0].thislogin,
                })
            };
            newThisLogin();
            function newThisLogin() {
                console.log("new login time");
                $rootScope.loading = true;
                thislogindate = {
                    thislogin: new Date().toString(),
                };
                Azureservice.update('users', {
                    id: user[0].id,
                    thislogin: thislogindate.thislogin
                })
                    .then(function () {
                        $location.path('/profile');
                        $rootScope.loading = false;
                    });
            }
        }
        throw "TypeError"; //user[0].name gives type error if no data is received from azure

    } catch (e) {
        // statements to handle any exceptions
        console.log("catch:", e);
        var userModel = {
            email: '',
            name: '',
            phone: '',
            thislogin: new Date().toString(),

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


var temp_data = [15, 10, 5, 4, 3, 2, 1];
var humi_data = [13, 8, 7, 6, 5, 4, 3];
var sunl_data = [11, 6, 4, 3, 2, 2, 0];

//	Graafik
app.controller("LineCtrl", function ($scope) {

    $scope.labels = ["Mon", "Tue", "Wed", "Thur", "Fri", "Sat", "Sun"];
    $scope.series = ['Temp', 'Humidity', 'Sunlight'];
    $scope.data = [temp_data, humi_data, sunl_data];

    $scope.buttonId = function (btnId) {
        button_id = btnId;
        //console.log(button_id);
    };
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
            })
        }

        $scope.logingo = function () {
            Azureservice.login('google').then(function () {
                $route.reload();
            })
        }
    } else {
        $location.path('/newuser');
    }
     
});