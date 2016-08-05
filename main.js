var app = angular.module('xrAdventureApp', ['ui.router', 'ngSanitize', 'ng-showdown']);

app.config(['$stateProvider', '$urlRouterProvider', '$showdownProvider',
    function($stateProvider, $urlRouterProvider, $showdownProvider) {

        $urlRouterProvider.otherwise('/welcome');

        $stateProvider
            .state('welcome', {
                url: '/welcome',
                templateUrl: 'partials/welcome.html',
                controller: 'welcomeCtrl'
            }).state('showAdventure', {
                url: '/showAdventure/:name',
                templateUrl: 'partials/adventure.html',
                controller: 'showAdventureCtrl'
            }).state('showAdventure.photo', {
                url: '/showAdventure/:name/:photourl',
                templateUrl: 'partials/view-photo.html',
                controller: 'showAdventureCtrl'
            });

        showdownImgExtension = function() {
            var ext1 = {
                type: 'output',
                regex: /(.*?)<img(.*?)/g,
                replace: '$1<img class="adventure-image" $2'
            };

            return [ext1];
        };

        $showdownProvider.setOption('parseImgDimensions', true);
        $showdownProvider.setOption('tables', true);
        $showdownProvider.loadExtension(showdownImgExtension);
    }
]);

app.factory('dataService', ['$q', '$http', function($q, $http) {

    var someDataURL = '/loadMarkdown';

    var loadAdventureDetails = function(adventureName) {
        return $http.get('/loadAdventureDetails', {
            params: {
                name: adventureName
            }
        });
    };

    var loadAdventureList = function() {
        return $http.get('/loadAdventureList')
    };

    return {
        loadAdventureDetails: loadAdventureDetails,
        loadAdventureList: loadAdventureList
    };
}]);


app.controller('AppCtrl', ['$scope', '$interval', 'dataService',
    function($scope, $interval, dataService) {

        dataService.someMockService()
            .then(function(mockData) {
                $scope.data = mockData;
            });

    }
]);

app.controller('welcomeCtrl', ['$scope', 'dataService', '$state',
    function($scope, dataService, $state) {


        dataService.loadAdventureList()
            .then(function(result) {
                $scope.adventureList = _.sortBy(result.data, function(adv) {
                    return moment(adv.date).toDate();
                }).reverse();
                $scope.chooseAdventure($scope.adventureList[0]);
            }, function(err) {
                console.log('error', err);
            });

        $scope.chooseAdventure = function(selectedAdv) {
            _.each($scope.adventureList, function(adv) {
                if (selectedAdv === adv) {
                    adv.selected = true;
                } else {
                    adv.selected = false;
                }

            });

            $state.go('showAdventure', {
                name: selectedAdv.name
            });

        };
    }
]);


app.controller('showAdventureCtrl', ['$scope', 'dataService', '$stateParams', '$rootScope', '$timeout', '$document', '$element', '$state',
    function($scope, dataService, $stateParams, $rootScope, $timeout, $document, $element, $state) {

        console.log('stateParams', $stateParams);
        $scope.photourl = $stateParams.photourl;

        $rootScope.clickImage = function() {
            console.log('image was clicked');
        };


        $scope.handlePhotoClick = function(clicked) {
            $scope.photoOpacity= 0;
            console.log('clicked', clicked);
            console.log('element', angular.element(clicked.srcElement));

            // show the photo
            $state.go('showAdventure.photo', {
                photourl: angular.element(clicked.srcElement)[0].currentSrc
            });

            // wait until the photo gets written into the DOM, then set the opacity
            $timeout(function() {
                $scope.photoOpacity= 1;
            }, 100);
        };

        dataService.loadAdventureDetails($stateParams.name)
            .then(function(result) {
                $scope.details = result.data;

                // wait a second for the HTML to render, then attach click handlers to the images
                $timeout(function() {
                    var x = $document.find('img');
                    _.each(x, function(i) {
                        console.log('adding click handler to', i);
                        angular.element(i).bind('click', $scope.handlePhotoClick);
                    })
                }, 300);
            }, function(err) {
                console.log('error', err);
            })
    }
]);
