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
app.controller('DashboardCtrl', function(UserFactory, GoalFactory, $scope, $http) {
  // List of users got from the server
  $scope.users = [];
  $scope.me = [];
  $scope.goal = [];

  getMyDetails();
  getGoals();

    function getMyDetails() {
        UserFactory.getMyDetails()
            .success(function (me) {
                // $scope.customers = custs;
                $scope.me.email = me;
                console.log(JSON.stringify(me));
            })
            .error(function (error) {
                $scope.status = 'Unable to load customer data: ' + error.message;
            });
    }

    function getGoals(){
        GoalFactory.get()
          .success(function(goal){
            $scope.goal = goal;
          })
          .error(function(error){
            $scope.status = 'Unable to load goal: ' + error.message;
          })
    }

    // function getActions()
    // foreach goal in goals...
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


//factory
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
