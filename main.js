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
            });

        showdownImgExtension = function() {
            var ext1 = {
                type: 'output',
                regex: /(.*?)<img(.*?)/g,
                replace: '$1<img class="adventure-image" ng-click="root.clickImage()" {{testme}} $2'
            };

            return [ext1];
        };

        $showdownProvider.setOption('parseImgDimensions', true);
        $showdownProvider.loadExtension(showdownImgExtension);
    }
]);

app.factory('dataService', ['$q', '$http', function($q, $http) {

    var someDataURL = '/loadMarkdown';

    var loadAdventureMarkdown = function(adventureName) {
        return $http.get('/loadAdventureMarkdown', {
            params: {
                name: adventureName
            }
        });
    };

    var loadAdventureList = function() {
        return $http.get('/loadAdventureList')
    };

    return {
        loadAdventureMarkdown: loadAdventureMarkdown,
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


app.controller('showAdventureCtrl', ['$scope', 'dataService', '$stateParams', '$rootScope', '$timeout',
    function($scope, dataService, $stateParams, $rootScope, $timeout) {

        $rootScope.clickImage = function() {
            console.log('image was clicked');
        };

        dataService.loadAdventureMarkdown($stateParams.name)
            .then(function(result) {
                $scope.markdown = result.data;

            }, function(err) {
                console.log('error', err);
            })
    }
]);
