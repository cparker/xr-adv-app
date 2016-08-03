var app = angular.module('xrAdventureApp', ['ui.router']);

app.config(function($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise('/welcome');

    $stateProvider.state('welcome', {
        url: '/welcome',
        templateUrl: 'partials/welcome.html',
        controller: 'welcomeCtrl'
    });

});

app.factory('dataService', ['$q', '$http', function($q, $http) {

    var someDataURL = '/getMeData';

    var someMockService = function() {
        return $q.when({
            "a": 1
        });
    };


    var someRealService = function() {
        return $http.get(someDataURL);
    };

    return {
        someRealService: someRealService,
        someMockService: someMockService
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

app.controller('welcomeCtrl', ['$scope',
    function($scope) {
      $scope.foo='bar';
    }
]);
