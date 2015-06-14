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
    $routeProvider.when('/', { templateUrl: 'forms.html', reloadOnSearch: false });
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

//
// `$drag` example: drag to dismiss
//
app.directive('dragToDismiss', function ($drag, $parse, $timeout) {
    return {
        restrict: 'A',
        compile: function (elem, attrs) {
            var dismissFn = $parse(attrs.dragToDismiss);
            return function (scope, elem, attrs) {
                var dismiss = false;

                $drag.bind(elem, {
                    constraint: {
                        minX: 0,
                        minY: 0,
                        maxY: 0
                    },
                    move: function (c) {
                        if (c.left >= c.width / 4) {
                            dismiss = true;
                            elem.addClass('dismiss');
                        } else {
                            dismiss = false;
                            elem.removeClass('dismiss');
                        }
                    },
                    cancel: function () {
                        elem.removeClass('dismiss');
                    },
                    end: function (c, undo, reset) {
                        if (dismiss) {
                            elem.addClass('dismitted');
                            $timeout(function () {
                                scope.$apply(function () {
                                    dismissFn(scope);
                                });
                            }, 400);
                        } else {
                            reset();
                        }
                    }
                });
            };
        }
    };
});

//
// Another `$drag` usage example: this is how you could create 
// a touch enabled "deck of cards" carousel. See `carousel.html` for markup.
//
app.directive('carousel', function () {
    return {
        restrict: 'C',
        scope: {},
        controller: function ($scope) {
            this.itemCount = 0;
            this.activeItem = null;

            this.addItem = function () {
                var newId = this.itemCount++;
                this.activeItem = this.itemCount == 1 ? newId : this.activeItem;
                return newId;
            };

            this.next = function () {
                this.activeItem = this.activeItem || 0;
                this.activeItem = this.activeItem == this.itemCount - 1 ? 0 : this.activeItem + 1;
            };

            this.prev = function () {
                this.activeItem = this.activeItem || 0;
                this.activeItem = this.activeItem === 0 ? this.itemCount - 1 : this.activeItem - 1;
            };
        }
    };
});

app.directive('carouselItem', function ($drag) {
    return {
        restrict: 'C',
        require: '^carousel',
        scope: {},
        transclude: true,
        template: '<div class="item"><div ng-transclude></div></div>',
        link: function (scope, elem, attrs, carousel) {
            scope.carousel = carousel;
            var id = carousel.addItem();

            var zIndex = function () {
                var res = 0;
                if (id == carousel.activeItem) {
                    res = 2000;
                } else if (carousel.activeItem < id) {
                    res = 2000 - (id - carousel.activeItem);
                } else {
                    res = 2000 - (carousel.itemCount - 1 - carousel.activeItem + id);
                }
                return res;
            };

            scope.$watch(function () {
                return carousel.activeItem;
            }, function (n, o) {
                elem[0].style['z-index'] = zIndex();
            });


            $drag.bind(elem, {
                constraint: { minY: 0, maxY: 0 },
                adaptTransform: function (t, dx, dy, x, y, x0, y0) {
                    var maxAngle = 15;
                    var velocity = 0.02;
                    var r = t.getRotation();
                    var newRot = r + Math.round(dx * velocity);
                    newRot = Math.min(newRot, maxAngle);
                    newRot = Math.max(newRot, -maxAngle);
                    t.rotate(-r);
                    t.rotate(newRot);
                },
                move: function (c) {
                    if (c.left >= c.width / 4 || c.left <= -(c.width / 4)) {
                        elem.addClass('dismiss');
                    } else {
                        elem.removeClass('dismiss');
                    }
                },
                cancel: function () {
                    elem.removeClass('dismiss');
                },
                end: function (c, undo, reset) {
                    elem.removeClass('dismiss');
                    if (c.left >= c.width / 4) {
                        scope.$apply(function () {
                            carousel.next();
                        });
                    } else if (c.left <= -(c.width / 4)) {
                        scope.$apply(function () {
                            carousel.next();
                        });
                    }
                    reset();
                }
            });
        }
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
app.controller('MainController', function ($rootScope, $scope, Azureservice) {
    Azureservice.login('google');
    // User agent displayed in home page
    $scope.userAgent = navigator.userAgent;

    // Needed for the loading screen
    $rootScope.$on('$routeChangeStart', function () {
        $rootScope.loading = true;
    });

    $rootScope.$on('$routeChangeSuccess', function () {
        $rootScope.loading = false;
    });

    // Fake text i used here and there.
    $scope.lorem = 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Vel explicabo, aliquid eaque soluta nihil eligendi adipisci error, illum corrupti nam fuga omnis quod quaerat mollitia expedita impedit dolores ipsam. Obcaecati.';

    // 
    // 'Scroll' screen
    // 
    var scrollItems = [];

    for (var i = 1; i <= 100; i++) {
        scrollItems.push('Item ' + i);
    }

    $scope.scrollItems = scrollItems;

    $scope.bottomReached = function () {
        alert('Congrats you scrolled to the end of the list!');
    }



    //
    // 'Forms' screen
    //  
    $scope.rememberMe = true;
    $scope.email = 'me@example.com';

    $scope.login = function () {

        alert('You submitted the login form');
    };

    // 
    // 'Drag' screen
    // 
    $scope.notices = [];

    for (var j = 0; j < 10; j++) {
        $scope.notices.push({ icon: 'envelope', message: 'Notice ' + (j + 1) });
    }

    $scope.deleteNotice = function (notice) {
        var index = $scope.notices.indexOf(notice);
        if (index > -1) {
            $scope.notices.splice(index, 1);
        }
    };
});



// Number picker stuff
/*
var demo = angular.module('demo', ['angularNumberPicker']);

demo.controller('DemoController', ['$scope', function($scope) {
		console.log($scope.input);
        $scope.input = {
            num: 0
        };

        $scope.getNumber = function() {
            alert('The number is: [' + $scope.input.num + ']');
        };

}]);
*/

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