'use strict';

/**********************************************************************
 * Angular Application
 **********************************************************************/
var app = angular.module('app', ['ngResource', 'ngRoute', 'ngAnimate', 'ngAria', 'ngMaterial', 'ngMdIcons', 'nvd3'])
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
      .when('/tracking', {
        templateUrl: 'views/tracking.html',
        controller: 'TrackingCtrl',
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
      .when('/dashboard', {
        templateUrl: 'views/dashboard.html',
        controller: 'DashboardCtrl',
        resolve: {
          loggedin: checkLoggedin
        }
      })
      .otherwise({
        redirectTo: '/'
      });
    //================================================

  }) // end of config()
  .run(function($rootScope, $http, $location){

    $rootScope.location = $location;
    $rootScope.message = '';

    $rootScope.busy = false;
    // Logout function is available in any pages
    $rootScope.logout = function(){
      $rootScope.user = {};
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
    $rootScope.busy = true;
    $http.post('/login', {
      username: $scope.user.username,
      password: $scope.user.password
    })
    .success(function(user){
      // No error: authentication OK
      $rootScope.message = 'Authentication successful! via google';
      $location.url('/tracking');
      $rootScope.busy = false;

    })
    .error(function(){
      // Error: authentication failed
      $rootScope.message = 'Authentication failed.';
      $scope.loginStatus = "Invalid details";
      $location.url('/login');
    });
  };

    $scope.loginGoogle = function(){
    $rootScope.busy = true;
    $http.get('/auth/google', {
    })
    .success(function(user){
      // No error: authentication OK
      console.log('logged in as : ' + user);
      $location.url('/#/tracking');
      $rootScope.busy = false;

    })
    .error(function(){
      // Error: authentication failed
      $rootScope.message = 'Authentication failed.';
      $location.url('/login');
      $rootScope.busy = false;

    });
  };

    $scope.loginGithub = function(){
      $rootScope.busy = true;
    }

});


/**********************************************************************
 * dashboard controller
 **********************************************************************/
app.controller('DashboardCtrl', function($scope, $http, $mdSidenav, $timeout, $rootScope) {
 $scope.goal = [];
 $scope.action = [];
 $scope.goal.status = {};
 $scope.action.status = [];
 $scope.goal.recent = [];
 $scope.action.recent = [];
 $scope.goal.upcoming = [];
 $scope.action.upcoming = [];
 $scope.lastDays = 7;

 // Initialise with dummy data
 $scope.goal.status = {"open": 5, "closed": 3, "completed": 2};
 $scope.action.status = {"open": 11, "closed": 4, "completed": 3};
 $scope.goal.recent = [{"description": "Become a web dev", "date_modified": "2016-01-02", "update": "edit"},{"description": "Swim in the Pacific", "date_modified": "2016-01-30", "update": "edit"},{"description": "Become a web dev", "date_modified": "2016-01-02", "update": "edit"},{"description": "Swim in the Pacific", "date_modified": "2016-01-30", "update": "edit"},{"description": "Become a web dev", "date_modified": "2016-01-02", "update": "edit"},{"description": "Swim in the Pacific", "date_modified": "2016-01-30", "update": "edit"},{"description": "Become a web dev", "date_modified": "2016-01-02", "update": "edit"},{"description": "Swim in the Pacific", "date_modified": "2016-01-30", "update": "edit"},{"description": "Become a web dev", "date_modified": "2016-01-02", "update": "edit"},{"description": "Swim in the Pacific", "date_modified": "2016-01-30", "update": "edit"},{"description": "Become a web dev", "date_modified": "2016-01-02", "update": "edit"},{"description": "Swim in the Pacific", "date_modified": "2016-01-30", "update": "edit"}];
 $scope.action.recent = [{"description": "Become a web dev", "date_modified": "2016-01-02", "update": "progress"}];
 $scope.goal.upcoming = [{"description": "Develop habits of good health", "due": "2016-03-01"},{"description": "Become a web dev", "due": "2016-03-15"}];

 // set correct dates
 for (var i = 0; i < $scope.goal.recent.length; i++) {
   $scope.goal.recent[i].date_modified = new Date($scope.goal.recent[i].date_modified);
 };

 for (var i = 0; i < $scope.action.recent.length; i++) {
   $scope.action.recent[i].date_modified = new Date($scope.action.recent[i].date_modified);
 };

 for (var i = 0; i < $scope.goal.upcoming.length; i++) {
   $scope.goal.upcoming[i].due = new Date($scope.goal.upcoming[i].due);
 };

 for (var i = 0; i < $scope.action.upcoming.length; i++) {
   $scope.action.upcoming[i].due = new Date($scope.action.upcoming[i].due);
 };

});
/**********************************************************************
 * tracking controller
 **********************************************************************/
app.controller('TrackingCtrl', function(UserFactory, GoalFactory, ActionFactory, GoalActionProgressFactory, ProgressFactory, $scope, $http, periodInWordsFilter, $filter, MenuService, $mdSidenav, $timeout, $rootScope) {
  // List of users got from the server
  //$scope.users = [];
  $scope.me = [];
  $scope.goal = [];
  $scope.action = [];
  $scope.progress = [];
  $scope.chart = [];

  $scope.statusList = ['Open', 'Closed - Complete', 'Closed - Incomplete'];

  $scope.editGoal = [];
  $scope.editAction = [];

  $scope.preEditGoal = [];
  $scope.preEditAction = [];

  $scope.filter = [];
  $scope.filter.goal = [];
  $scope.filter.action = [];

  // initialise default filters
  // TODO: allow user to save filters and preload last viewed
  $scope.filter.goal.open = true;
  $scope.filter.goal.closedComplete = false;
  $scope.filter.goal.closedIncomplete = false;
  $scope.filter.action.open = true
  $scope.filter.action.closedComplete = false;
  $scope.filter.action.closedIncomplete = false;

  $scope.getGoalAndActionFilter = function(){
    console.log('Filter');
    console.log($scope.filter);
  }

  $scope.showEditGoalMenu = function(goal){
    // http://stackoverflow.com/questions/122102/what-is-the-most-efficient-way-to-clone-an-object
    $scope.preEditGoal = Object.assign({}, goal);
    $scope.editGoal = goal;
    $scope.editGoal.due = new Date(goal.due);
    console.log('goal:');
    console.log(goal);

    $mdSidenav('editGoal').toggle();
  }

  $scope.showEditActionMenu = function(goal, action){
    $scope.preEditAction = Object.assign({}, action);
    $scope.preEditAction.due = new Date(action.due);
    $scope.preEditAction._goalid = goal._goalid;
    $scope.preEditAction._id = action._id;

    $scope.editAction = action;
    $scope.editAction.due = new Date(action.due);
    $scope.editAction._goalid = goal._id;
    $scope.editAction._id = action._id;
    console.log($scope.editAction.pre);
    
    $mdSidenav('editAction').toggle();
  }
// http://stackoverflow.com/questions/16261348/descending-order-by-date-filter-in-angularjs
  $scope.getDateCreated = function(item) {
    var date = new Date(item.date_created);
    return date;
  };

  $scope.createGoal = function(description, due, status, is_public){
    var dueDate = new Date(due);
    if (status){status=status.trim();}

    console.log('Create goal: ' + description + ' due: ' + dueDate);
    GoalFactory.post(description, dueDate, status, is_public)
      .success(function(res){
        console.log('Successfully created goal');
        // recalculate goals, etc. so they're rendered
        console.log(res);
        $scope.goal.push(res);
        // $scope.goal.splice(0, 0, res);

        console.log($scope.goal);
      })
      .error(function(error){
        console.log('Could not create goal');
      });
  }

  $scope.deleteGoal = function(goal){
    GoalFactory.delete(goal._id)
      .success(function(res){
        console.log('successfully deleting goal');
        var index = $scope.goal.indexOf(goal);
        console.log('index:');
        console.log(index);
        $scope.goal.splice(index, 1);
        $mdSidenav('editGoal').toggle();

      })
      .error(function(error){
        console.log('error deleting goal');
      });
  }

  $scope.deleteAction = function(action){
    ActionFactory.delete(action._id)
      .success(function(res){
        console.log('successfully deleting goal');
        var index = $scope.action.indexOf(action);
        console.log('index:');
        console.log(index);
        $scope.action.splice(index, 1);
        $mdSidenav('editAction').toggle();
        
      })
      .error(function(error){
        console.log('error deleting goal');
      });
  }

  $scope.updateGoal = function(_goalid, description, due, status, publicallyViewable){
    var dueDate = new Date(due);
    if (status){status=status.trim();}
    GoalFactory.put(_goalid, description, dueDate, status, publicallyViewable)
      .success(function(res){
        console.log('Successfully updated goal');
        $mdSidenav('editGoal').toggle();
      })
      .error(function(error){
        console.log('Could not update goal');

      });
  }

  $scope.updateAction = function(_goalid, verb, verb_quantity, noun, period, due, status, is_public, _id, action){
    // $scope.goal to find goal, splice(0,0, action)
    // var action = {_goalid: goalid, verb: verb, verb_quantity: verb_quantity, noun: noun, period: period, due: due};
    //var now = new Date(Date.now());
    status = status.trim();

    console.log('input: _goalid: ' + _goalid + ' verb_quantity: ' + verb_quantity);
    ActionFactory.put(_goalid, verb, verb_quantity, noun, period, due, status, is_public, _id)
      .success(function(res){
       console.log('Successfully created action');
       //$scope.action.push(res);
       // $scope.prepareData(res); Necessary?
       //$scope.prepareData(action);
       console.log(res);
      $mdSidenav('editAction').toggle();

      })
      .error(function(error){
       console.log('Unsuccessful at creating action');
      });
  }
  // console.log(periodInWordsFilter(7,1));
  $scope.toggleMenu = function(id) {
    $mdSidenav(id).toggle();
  };

  $scope.cancelUpdateGoal = function(){
    console.log('preEditGoal');
    console.log($scope.preEditGoal);
    $scope.editGoal.description = $scope.preEditGoal.description;
    $scope.editGoal.due         = new Date($scope.preEditGoal.due);
    $scope.editGoal.status      = $scope.preEditGoal.status;
    $scope.editGoal.is_public   = $scope.preEditGoal.is_public;
    $mdSidenav('editGoal').toggle();
  }

  // goalSelected, action.verb, action.verb_quantity, action.noun, action.period, action.due, action.status, action.is_public

  $scope.cancelUpdateAction = function(){
    console.log('preEditGoal');
    console.log($scope.preEditAction);
    $scope.editAction.verb           = $scope.preEditAction.verb;
    $scope.editAction.verb_quantity  = $scope.preEditAction.verb_quantity;
    $scope.editAction.noun           = $scope.preEditAction.noun;
    $scope.editAction.period         = $scope.preEditAction.period;
    $scope.editAction.due            = new Date($scope.preEditAction.due);
    $scope.editAction.status         = $scope.preEditAction.status;
    $scope.editAction.is_public      = $scope.preEditAction.is_public;
    $mdSidenav('editAction').toggle();
  }

//goalSelected, action.verb, action.verb_quantity, action.noun, action.period, action.due
  $scope.createAction = function(_goalid, verb, verb_quantity, noun, period, due, status, is_public){
    // $scope.goal to find goal, splice(0,0, action)
    // var action = {_goalid: goalid, verb: verb, verb_quantity: verb_quantity, noun: noun, period: period, due: due};
    var now = new Date(Date.now());
    status = status.trim();

    console.log('input: _goalid: ' + _goalid + ' verb_quantity: ' + verb_quantity);
    ActionFactory.post(_goalid, verb, verb_quantity, noun, period, due, now, status, is_public)
      .success(function(res){
       console.log('Successfully created action');
       $scope.action.push(res);
       $scope.prepareData(res);
      })
      .error(function(error){
       console.log('Unsuccessful at creating action');
      });
  }
  // console.log(periodInWordsFilter(7,1));
  $scope.toggleMenu = function(id) {
    $mdSidenav(id).toggle();
  };

  $scope.updateProgress = function(action, progress){
    $rootScope.busy = true;
    ProgressFactory.post(action._id, progress)
      .success(function (res){
        console.log('ProgressFactory success: ' + JSON.stringify(res));
        console.log($scope.action);
        action.currentProgress += progress;
        action.chart.data[0].values[action.currentPeriod-1].y += progress;
        $rootScope.busy = false;
      })
      .error(function(error){
        console.log('ProgressFactory error: ' + JSON.stringify(error));
        $rootScope.busy = false;
      });

    //console.log('actionid: ' + actionid + ', progress: ' + progress);
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

  // create values array for nvd3 graph
  action.chart = [];
  action.chart.xAxisLabel = periodInWordsFilter(action.period, 1) + ' since ' + $filter('date')(action.date_created, "dd MMM, yyyy");
  action.chart.data = [{key: 'progress', values: []}];

  // for (var i = 0; i < totalPeriodsIncludingCurrent.length; i++) {
  //   var value = {x: i+1, y: 0};
  //   action.chart.data[0].values.push(value);
  // };

  // for (var i = action.summary.length - 1; i >= 0; i--) {
  //   var period = action.summary[i].period;
  //   action.chart.data[0].values[period-1].y = action.summary[i].progress;
  // };

for (var i = 0; i < totalPeriodsIncludingCurrent; i++) {
  var value = {x: i+1, y: 0};
  action.chart.data[0].values.push(value);
};

for (var i = 0; i < action.summary.length; i++) {
  var period = action.summary[i].period;
  action.chart.data[0].values[period-1].y = action.summary[i].progress;
};

action.chart.options = {
            chart: {
                type: 'multiBarChart',
                showControls: false,
                showLegend: false,
                height: 130,
                margin : {
                    top: 20,
                    right: 20,
                    bottom: 50,
                    left: 80
                },
                clipEdge: true,
                duration: 500,
                stacked: true,
                forceY: [0, action.verb_quantity],
                xAxis: {
                    axisLabel: action.chart.xAxisLabel,
                    showMaxMin: false,
                    tickFormat: function(d){
                        return d3.format(',f')(d);
                    }
                },
                yAxis: {
                    axisLabel: 'Progress',
                    axisLabelDistance: -20,
                    showMaxMin: true,
                    tickFormat: function(d){
                        return d3.format(',f')(d);
                    }
                }
            }
        };


  action.currentProgress = currentProgress;
  return null;

  // action.daysRemaining = daysRemaining;
  // action.deadline = deadline;
  // action.currentPeriod = totalPeriodsIncludingCurrent;
  // action.currentProgress = 0;
}


$scope.getGoalsActionsProgress = function(){
      $rootScope.busy = true;
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

        // correctly format dates from string
        for (var i = $scope.goal.length - 1; i >= 0; i--) {
          $scope.goal[i].date_created = new Date($scope.goal[i].date_created);
          $scope.goal[i].date_modified = new Date($scope.goal[i].date_modified);
          $scope.goal[i].due = new Date($scope.goal[i].due);
        };

        // prepare data clientside - e.g. progress in current period, days remaining
        for (var i = $scope.action.length - 1; i >= 0; i--) {
          $scope.action[i].date_created = new Date($scope.action[i].date_created);
          $scope.action[i].date_modified = new Date($scope.action[i].date_modified);
          $scope.action[i].due = new Date($scope.action[i].due);
          $scope.prepareData($scope.action[i]);
        };

          console.log(goalActionProgress);
          $rootScope.busy = false;
          return null;
        })
        .error(function(error){
          $scope.status = 'Unable to load goals/actions: ' + error.message;
          $rootScope.busy = false;
          return null;
        })
    }

    $scope.getGoalsActionsProgress();

    $scope.getUser = function(){
      $rootScope.busy = true;
      UserFactory.get()
        .success(function(user){
          console.log(user);
          $rootScope.user = {};
          $rootScope.user = user;
          console.log($rootScope.user);
          $rootScope.busy = false
        })
        .error(function(error){
          console.log('Error getting user');
          $rootScope.busy = false
        });
    }

    $scope.getUser();
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
          $location.path('/tracking');
          console.log('angular: registered user successfully');
        }, function errorCallback(response) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          $scope.signupNotification = response.data;
          console.log(response.data);
        });
  }
});


/**********************************************************************
 * Root page controller
 **********************************************************************/
app.controller('RootCtrl', ['MenuService', '$scope', '$rootScope', '$location', '$mdSidenav', function(MenuService, $scope, $rootScope, $location, $mdSidenav) {
  $scope.menu = MenuService.menu;
  $scope.newItem = $scope.menu.length;

  $scope.toggleMenu = function(id) {
    $mdSidenav(id).toggle();
  };

  $scope.pagename = function() { return $location.path(); };

  $scope.addItem = function() {
    MenuService.add( $scope.newItem );  
   };

   $scope.hello = function(){
    console.log('hello world');
   }

   $scope.functionRunner = function(f){
    switch(f){
      case 'hello':
        console.log('hey there..location: ' + $location.path());
        return $location.path();
        break;
      case 'world':
        console.log('worldy');
        break;
      case 'logout':
        $rootScope.logout();
        break;
      default:
        console.log('Come again?');
        break;
    }
   }

}]);


// SERVICES
 app.service( 'MenuService', [ '$rootScope', function( $rootScope ) {
   return {
      menu: [{ type: 'button', icon:'settings', ngClick: '', href: ''}],
      add: function( item ) {
        this.menu.push( item );
      }
   };
 }])

// FACTORIES
app.factory('UserFactory', function($http) {
     
    var factory = {};
    return {
        get: function() {
            return $http.get('/api/v1/me');
        }
    };
});

app.factory('GoalFactory', function($http) {
     
    var factory = {};
    return {
        get: function() {
            return $http.get('/api/v1/goal');
        },
        post: function(description, dueDate, status, is_public){
            var body = {description: description, due: dueDate, status: status, is_public: is_public};
            return $http.post('/api/v1/goal', body);
        },
        put: function(_goalid, description, dueDate, status, is_public){
            var body = {description: description, due: dueDate, status: status, is_public: is_public};
            return $http.put('/api/v1/goal/' + _goalid, body);
        },
        delete: function(_goalid){
          return $http.delete('/api/v1/goal/' + _goalid);
        }
    };
});

app.factory('ActionFactory', function($http){
  var factory = {};
  return {
    post: function(_goalid, verb, verb_quantity, noun, period, due, date_created, status, is_public){
      var body = {_goalid: _goalid, verb: verb, verb_quantity: verb_quantity, noun: noun, period: period, due: due, date_created: date_created, status: status, is_public: is_public};
      return $http.post('/api/v1/action', body);
    },
    put: function(_goalid, verb, verb_quantity, noun, period, due, status, is_public, _id){
    var body = {_goalid: _goalid, verb: verb, verb_quantity: verb_quantity, noun: noun, period: period, due: due, status: status, is_public: is_public};
      return $http.put('/api/v1/action/' + _id, body);
    },
    delete: function(_id){
      return $http.delete('/api/v1/action/' + _id);
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
  return function(period, format) {
    // format 0 - once, every x, etc.
    // format 1 - Days, Weeks, Months, etc.
    switch(period){
      case 0:
        return ['once', 'One time'][format];
        break;
      case 1:
        return ['every day', 'Days'][format];
        break;
      case 7:
        return ['every week', 'Weeks'][format];
        break;
      case 30:
        return ['every month', 'Months'][format];
        break;
      case 180:
        return ['every six months', 'Half Years'][format];
        break;
      case 365:
        return ['every year', 'Years'][format];
        break;
      default:
        return ['every ' + period + ' days', period + ' day period'][format];
        break;
    }
  };
});

// DIRECTIVES

