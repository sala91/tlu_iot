//  ID
var button_id = null;

// 
// Siin defineerime moodulid millest meie app
// on s]ltuv ( is dependent) aka dependencies
// 
var app = angular.module('MobileAngularUiExamples', [
  'ngRoute',  // routimiseks vajalik
  'angularNumberPicker', // numberpicker lehel kus uut planti lisatakse
  'chart.js', // chartide jaoks
  'azure-mobile-service.module', // azuriga suhtlemiseks
  'mobile-angular-ui.gestures',// scroll ja muud  gesturess
  'mobile-angular-ui', // mobiilse uI jaoks
]);

// azuriga [hendamiseks  url ja key
app.constant('AzureMobileServiceClient', {  
    API_URL: 'https://tluiot.azure-mobile.net/',
    API_KEY: 'emtMObLICkvMeJWizeReyDZQIchRoa78'
});

// 
// M''rab 'ra millist templatei index file'i sisse lugeda                                                                              
//  määrab milline contoller millise templateiga kokku käib                                                                                   
//    resolvib suhtlust azuriga ja kuvab seniks loading screeni                                
//  app konfiguratsioon
app.config(function ($routeProvider) {
    $routeProvider.when('/', { templateUrl: '/templates/forms.html', controller: 'login', reloadOnSearch: false });
    $routeProvider.when('/home', { templateUrl: '/templates/home.html', reloadOnSearch: false });
    $routeProvider.when('/profile', {
        templateUrl: '/templates/profile.html',
        controller: 'getuser',
        reloadOnSearch: false,
        resolve: {
            'user': function (Azureservice) {
                return Azureservice.getAll('users');
            }
        }
    });

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
            'plants': function (Azureservice) {
                return Azureservice.getAll('plant');
            },
            'badges': function (Azureservice) {
                return Azureservice.getAll('badges');
            },
            'matchedBadges': function (Azureservice) {
                return Azureservice.read('badges');
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
            // saab vastava ID'ga sissekande
            'selected': function (Azureservice) {
                return Azureservice.getById('plant', button_id);
            }
        }
    });

});


app.controller('getuser', function ($scope, user) {
    $scope.user = user;
    $scope.userId = function (uId) {
        user_id = uId;// Küsi madiselt
        console.log(user_id);
    };
});

// Graafiku controller
app.controller('pdetail', function ($scope, $rootScope, $location, Azureservice, plantdetail) {
    $scope.plantdetail = plantdetail;

    //  Graafiku sildid, legend, andmed
    $scope.labels = ["Mon", "Tue", "Wed", "Thur", "Fri", "Sat", "Sun"];
    $scope.series = ['Temp'];
    $scope.data = [
        [10, 14, 8, 10, 17, 21, 16],
    ];

    //saab taime nupu id, et kuvada edit lehel õige taime
    $scope.buttonId = function (btnId) {
        button_id = btnId;
    };

});
// 'saavutuste/ medalite' controller
app.controller('badgeController', function ($scope, Azureservice, plants, badges, matchedBadges) {
    $scope.plants = plants;
    $scope.badges = badges;
    $scope.matchedBadges = matchedBadges;

});
// Loob listi kasutaja taimedest PLANTLIST controller
app.controller('plantslist', function ($scope, Azureservice, plants, badges) {
    $scope.plants = plants;
    $scope.badges = badges;

    // Et oleks teada millisele taimele vajutati
    $scope.buttonId = function (btnId) {
        button_id = btnId;
    };

    var userId = plants[0].userId;


    //  Esimene saavutus
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

    //  Teine saavutus
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

//  Taime muutmise kontroller.
app.controller('editPlant', function ($scope, $rootScope, $location, Azureservice, selected) {
    $scope.selected = selected;
    
    //  Tekstiväljadele kuvatakse taime praegused andmed (veel muutmata)
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
    
    //  Muutused saadetakse andmebaasi.
    $scope.editForm = function () {
        $rootScope.loading = true;
        Azureservice.update('plant', $scope.newFormModel).then(function () {
            $location.path('/plantDetail');
            $rootScope.loading = false;
        });
    };
    //  Juhul, kui kasutaja soovis taime kustutada, siis siin taim kustutatakse andmebaasist.
    $scope.deletePlant = function () {
        $rootScope.loading = true;
        Azureservice.del('plant', { id: button_id }).then(function () {
            $location.path('/plantslist');
            $rootScope.loading = false;
        });
    };
});

// Uee kasutaja controller
app.controller('newuser', function ($scope, $rootScope, $location, Azureservice, user) {
    // Proovib saada user[0].name kasutaja nime kui kasutaja logib esimesel korral sisse ja kasutaja nime pole siis Type error
    try {
        if (user[0].name !== undefined) {
            console.log("trying", (user[0].name !== undefined));
            console.log(user[0].name);
            $rootScope.loading = false;
            LoginTimeSwich();
            function LoginTimeSwich() { // liigutab kasutaja viimase sisselogimis aja  lastlogin lahtrisse
                Azureservice.update('users', {
                    id: user[0].id,
                    lastlogin: user[0].thislogin,
                })
            };
            newThisLogin();
            function newThisLogin() { // loob uue aja thislogin 
                console.log("newThislogin");
                $rootScope.loading = true;
                thislogindate = {
                    thislogin: new Date().toString(),
                };
                Azureservice.update('users', {
                    id: user[0].id,
                    thislogin: thislogindate.thislogin
                })
                    .then(function () {
                       // liigub edasi järgmisele lehele
                        $location.path('/profile');
                        $rootScope.loading = false;
                    });
            }
        }
        throw "TypeError"; //user[0].name annab type error kui azure andmeid ei väljastanud (kasutajal polnud andmeid)

    } catch (e) {
        console.log("catch:", e);
        var userModel = {
            email: '',
            name: '',
            phone: '',
            thislogin: new Date().toString(),

        };
        $scope.userModel = userModel;
        $scope.sendUser = function () {// Saadab kasutaja info andmebaasi
            $rootScope.loading = true;
            Azureservice.insert('users', $scope.userModel).then(function () {
                $location.path('/profile');
                $rootScope.loading = false;
            });
        }
    }
});
// uus plant controller
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
    // saadab andmed uue taime kohta azuri
    $scope.sendForm = function () {

        $rootScope.loading = true;
        Azureservice.insert('plant', $scope.formModel).then(function () {
            $location.path('/plantslist');
            $rootScope.loading = false;
        });
    };
});

// Põhi controller, käivitatakse kui ühtki muud controllerit pole lehele määratud
app.controller('MainController', function ($rootScope, $scope, $route, $location, Azureservice) {
    //laadimis ekraan
    $rootScope.$on('$routeChangeStart', function () {
        $rootScope.loading = true;
    });

    $rootScope.$on('$routeChangeSuccess', function () {
        $rootScope.loading = false;
    });

    // Logoff funktsionaalsus
    $scope.logoff = function () {
        Azureservice.logout();
        document.getElementById('btm-nav-bar').style.display = 'none';
        $location.path('/');
    }

   
});

// andmed graafikute jaoks 
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

// graafikute jaoks
app.controller('chartCtrl', function ($scope, plantCount) {
    $scope.plantCount = plantCount;
});

// Login controller
app.controller('login', function ($rootScope, $scope, $route, Azureservice, $location) {
    if (!Azureservice.isLoggedIn()) {// ei ole sisse logitud
        $scope.loginfb = function () {
            Azureservice.login('facebook').then(function () {
                document.getElementById('btm-nav-bar').style.display = 'block';
                $route.reload();
            })
        }

        $scope.logingo = function () {
            Azureservice.login('google').then(function () {
                document.getElementById('btm-nav-bar').style.display = 'block';
                $route.reload();
            })
        }
    } else {// juba on sisse logitud
        $location.path('/newuser');
    }
     
});