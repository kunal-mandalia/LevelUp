'use strict';

/**********************************************************************
 * Angular Application
 **********************************************************************/
var app = angular.module('app', ['ngResource', 'ngRoute', 'ngAnimate', 'ngAria', 'ngMaterial', 'ngMdIcons'])
  .config(function($routeProvider, $locationProvider, $httpProvider, $mdThemingProvider) {
    
  var darkBlueMap = $mdThemingProvider.extendPalette('blue', {
    '500': '3470ce'
  });
  // Register the new color palette map with the name <code>neonRed</code>
  $mdThemingProvider.definePalette('darkBlue', darkBlueMap);
  // Use that theme for the primary intentions
  $mdThemingProvider.theme('default')
    .primaryPalette('darkBlue')
    //================================================
    // Check if the user is connected
    //================================================
    var checkLoggedin = function($q, $timeout, $http, $location, $rootScope){
      // Initialize a new promise
      var deferred = $q.defer();

      // Make an AJAX call to check if the user is logged in
      $http.get('/loggedin').success(function(user){
        // Authenticated
        if (user !== '0')
          /*$timeout(deferred.resolve, 0);*/
          deferred.resolve();

        // Not Authenticated
        else {
          $rootScope.message = 'You need to log in.';
          //$timeout(function(){deferred.reject();}, 0);
          deferred.reject();
          $location.url('/login');
        }
      });

      return deferred.promise;
    };
    //================================================
    
    //================================================
    // Add an interceptor for AJAX errors
    //================================================
    $httpProvider.interceptors.push(function($q, $location) {
      return {
        response: function(response) {
          // do something on success
          return response;
        },
        responseError: function(response) {
          if (response.status === 401)
            $location.url('/login');
          return $q.reject(response);
        }
      };
    });
    //================================================

    //================================================
    // Define all the routes
    //================================================
    $routeProvider
      .when('/', {
        templateUrl: '/views/main.html'
      })
      .when('/dashboard', {
        templateUrl: 'views/dashboard.html',
        controller: 'DashboardCtrl',
        resolve: {
          loggedin: checkLoggedin
        }
      })
      .when('/login', {
        templateUrl: 'views/login.html',
        controller: 'LoginCtrl'
      })
      .when('/signup', {
        templateUrl: 'views/signup.html',
        controller: 'SignupCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
    //================================================

  }) // end of config()
  .run(function($rootScope, $http){
    $rootScope.message = '';

    // Logout function is available in any pages
    $rootScope.logout = function(){
      $rootScope.message = 'Logged out.';
      $http.post('/logout');
    };
  });


/**********************************************************************
 * Login controller
 **********************************************************************/
app.controller('LoginCtrl', function($scope, $rootScope, $http, $location) {
  // This object will be filled by the form
  $scope.user = {};
  $scope.loginStatus = "";

  // Register the login() function
  $scope.login = function(){
    $http.post('/login', {
      username: $scope.user.username,
      password: $scope.user.password
    })
    .success(function(user){
      // No error: authentication OK
      $rootScope.message = 'Authentication successful! via google';
      $location.url('/dashboard');
    })
    .error(function(){
      // Error: authentication failed
      $rootScope.message = 'Authentication failed.';
      $scope.loginStatus = "Invalid details";
      $location.url('/login');
    });
  };

    $scope.loginGoogle = function(){
    $http.get('/auth/google', {
    })
    .success(function(user){
      // No error: authentication OK
      console.log('logged in as : ' + user);
      $location.url('/#/dashboard');
    })
    .error(function(){
      // Error: authentication failed
      $rootScope.message = 'Authentication failed.';
      $location.url('/login');
    });
  };

});



/**********************************************************************
 * Dashboard controller
 **********************************************************************/
app.controller('DashboardCtrl', function(UserFactory, GoalActionProgressFactory, ProgressFactory, $scope, $http) {
  // List of users got from the server
  //$scope.users = [];
  $scope.me = [];
  $scope.goal = [];
  $scope.action = [];
  $scope.progress = [];

  $scope.currentPeriod = -1;
  $scope.currentPeriodIndex = -1;

  $scope.currentDate = new Date(Date.now());
  $scope.daysLeft = -1;
  $scope.currentProgress = -1;
  $scope.currentPeriodDeadline = new Date();


  $scope.updateProgress = function(action, progress){

    ProgressFactory.post(action._id, progress)
      .success(function (res){
        console.log('ProgressFactory success: ' + JSON.stringify(res));
        console.log($scope.action);
        action.currentProgress += progress;
      })
      .error(function(error){
        console.log('ProgressFactory error: ' + JSON.stringify(error));
      });

    console.log('actionid: ' + actionid + ', progress: ' + progress);
  }

$scope.prepareData = function(action){

  var periodLengthMilliseconds = action.period * 86400000;
  var startDate = new Date(action.date_created);
  var startDateMilliseconds = startDate.getTime();
  var compareDateMilliseconds = Date.now();
  var totalPeriodsIncludingCurrent = Math.ceil((compareDateMilliseconds - startDateMilliseconds)/periodLengthMilliseconds);
  var daysRemaining = Math.ceil((startDateMilliseconds + (periodLengthMilliseconds * totalPeriodsIncludingCurrent) - compareDateMilliseconds)/86400000);
  action.daysRemaining = daysRemaining;
  
  var deadline = new Date(startDateMilliseconds + (totalPeriodsIncludingCurrent * periodLengthMilliseconds));
  action.deadline = deadline;
  action.currentPeriod = totalPeriodsIncludingCurrent;

  var totalPeriodsExcludingCurrent = totalPeriodsIncludingCurrent - 1; // if totalPeriodsIncludingCurrent = 0?

  var startCurrentPeriod = new Date(startDateMilliseconds + (periodLengthMilliseconds * totalPeriodsExcludingCurrent));
  var endCurrentPeriod = new Date(startDateMilliseconds + (periodLengthMilliseconds * totalPeriodsIncludingCurrent));
  var currentProgress = 0;

  // handle case where no current period progress
  for (var j = action.summary.length - 1; j >= 0; j--) {
    if (action.summary[j].period == action.currentPeriod) {
      currentProgress = action.summary[j].progress;
      break;
    };
  };

  action.currentProgress = currentProgress;

  return null;

  // action.daysRemaining = daysRemaining;
  // action.deadline = deadline;
  // action.currentPeriod = totalPeriodsIncludingCurrent;
  // action.currentProgress = 0;
}


$scope.getGoalsActionsProgress = function(){

      GoalActionProgressFactory.get()
        .success(function(goalActionProgress){
          $scope.goal = goalActionProgress[0];
          $scope.action = goalActionProgress[1];
          $scope.progress = goalActionProgress[2];

        /*
          Do the heavy lifting clientside - categorising progress into period buckets
          what info do we need from Progress?

          Component: Current period progress
            Output: Sum of progress filtered for current period over target progress for current period
            Input: Target progress per period (source: action.verb_quantity)

          Component: Days remaining
            Output: Days remaining
            Input: start_date, period_length, today.

          Component: Progress chart
            Output: progress per period and target. Progress coded to green or red if target met or missed respectively
            Input: 
        */

        // prepare data clientside - e.g. progress in current period, days remaining
        for (var i = $scope.action.length - 1; i >= 0; i--) {
          $scope.prepareData($scope.action[i]);
        };

          console.log(goalActionProgress);
          return null;
        })
        .error(function(error){
          $scope.status = 'Unable to load goals/actions: ' + error.message;
          return null;
        })
    }

    $scope.getGoalsActionsProgress();

});

/**********************************************************************
 * Signup controller
 **********************************************************************/
app.controller('SignupCtrl', function($scope, $http, $location) {
  // List of users got from the server
  $scope.newUser = $location.search();

  //http://stackoverflow.com/questions/679915/how-do-i-test-for-an-empty-javascript-object
  var newUserKeyLength = Object.keys($scope.newUser).length;
  if (newUserKeyLength>0){
    $scope.signupNotification = "Almost there";
  }

  $scope.registerUser = function() {
    console.log('registerUser...');
    $http.post('/registerUser', $scope.newUser)
        .then(function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available
          $location.path('/dashboard');
          console.log('angular: registered user successfully');
        }, function errorCallback(response) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          $scope.signupNotification = response.data;
          console.log(response.data);
        });
  }

  // console.log('newUser: ' + JSON.stringify($location.search()));
});


// FACTORIES

app.factory('UserFactory', function($http) {
     
    var factory = {};
    return {
        getMyDetails: function() {
            return $http.get('/api/v1/me');
        }
    };
});

app.factory('GoalFactory', function($http) {
     
    var factory = {};
    return {
        get: function() {
            return $http.get('/api/v1/goal');
        }
    };
});

app.factory('GoalActionProgressFactory', function($http) {
     
    var factory = {};
    return {
        get: function() {
            return $http.get('/api/v1/goalsActionsProgress');
        }
    };
});

app.factory('ProgressFactory', function($http) {
     
    var factory = {};
    return {
        post: function(actionid, progress) {
            var body = {_actionid: actionid, counter: progress};
            return $http.post('/api/v1/progress', body);
        }
    };
});
// FILTERS

// http://stackoverflow.com/questions/29989200/angular-calculate-percentage-in-the-html
app.filter('percentage', ['$filter', function ($filter) {
  return function (input, decimals) {
    return $filter('number')(input * 100, decimals) + '%';
  };
}]);

app.filter('daysRemainingDescription', function() {
  return function(daysLeft) {
    return (daysLeft == 1) ? 'day left' : 'days left';
  };
});

app.filter('periodInWords', function() {
  return function(period) {

    switch(period){
      case 0:
        return 'once';
        break;
      case 1:
        return 'every day';
        break;
      case 7:
        return 'every week';
        break;
      case 30:
        return 'every month';
        break;
      case 180:
        return 'every six months';
        break;
      case 365:
        return 'every year';
        break;
      default:
        return 'every ' + period + ' days';
        break;
    }
  };
});
