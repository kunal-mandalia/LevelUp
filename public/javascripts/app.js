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
      .when('/analytics', {
        templateUrl: 'views/analytics.html',
        controller: 'AnalyticsCtrl'
      })
      .when('/analytics2', {
        templateUrl: 'views/analytics2.html',
        controller: 'AnalyticsCtrl2'
      })
      .when('/goal', {
        templateUrl: 'views/goal.html',
        controller: 'GoalCtrl'
      })
      .when('/action', {
        templateUrl: 'views/action.html',
        controller: 'ActionCtrl'
      })
      .when('/list', {
        templateUrl: 'views/list.html',
        controller: 'listCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
    //================================================

  }) // end of config()
  .run(function($rootScope, $http, $location, $mdSidenav){

    $rootScope.location = $location;
    $rootScope.message = '';
    $rootScope.millisecondsInDay = 86400000;
    $rootScope.busy = false;

    // init DataService data structure
    $rootScope.data = [];
    $rootScope.data.loaded = false;
    // $rootScope.data.goal = [];
    // $rootScope.data.action = [];
    // $rootScope.data.goal.total = {open: 0, closed: 0, complete: 0};
    // $rootScope.data.action.total = {open: 0, closed: 0, complete: 0, repetition: 0, rep_complete: 0, rep_conversion: 0};
    $rootScope.data.outlook = 7;

    $rootScope.data.dashboard = [];
    $rootScope.data.activeGoal = [];
    $rootScope.data.activeAction = [];

    // $rootScope.data.dashboard.goal = ['g1', 'g2'];

    // $rootScope.activeGoal = {description: "test desc"};
    $rootScope.statusList = ['Open', 'Closed - Complete', 'Closed - Incomplete'];

    $rootScope.setData = function(goals, actions, progress, outlook, options){


      switch(options.branch){
        case "dashboard":

          $rootScope.data.dashboard = [];
          $rootScope.data.dashboard.goal = goals;
          $rootScope.data.dashboard.action = actions;
          $rootScope.data.dashboard.progress = progress;
          $rootScope.data.outlook = outlook;

          $rootScope.data.loaded = true;
          break;

        case "goal":

          var currentGoal = Object.assign({}, $rootScope.data.activeGoal.goal);

          $rootScope.data.activeGoal = [];

          if (options.goal) {
            $rootScope.data.activeGoal.goal = goals;
          } else {
            $rootScope.data.activeGoal.goal = currentGoal;
          }

          $rootScope.data.activeGoal.action = actions;
          $rootScope.data.activeGoal.progress = progress;
          $rootScope.data.activeGoal.preEdit = Object.assign({}, goals);

          break;

        case "action":

          $rootScope.data.activeAction = [];
          $rootScope.data.activeAction.preEdit = $rootScope.clone(actions[0]);
          $rootScope.data.activeAction.goal = goals;
          $rootScope.data.activeAction.action = actions;
          $rootScope.data.activeAction.progress = progress;

          break;

        default:
          break;
      }

      // console.log('setData');
      // // $rootScope.data = [];
      // $rootScope.data.goal = goals;
      // $rootScope.data.action = actions;
      // $rootScope.data.progress = progress;
      // $rootScope.data.outlook = outlook;
    }

    $rootScope.setActiveGoal = function(goal, options){
      var actions = [];
      var options = options;

      for (var i = 0; i < $rootScope.data.dashboard.action.length; i++) {

        if ($rootScope.data.dashboard.action[i]._goalid == goal._id){
          actions.push($rootScope.data.dashboard.action[i]);
        }
      };

      if (!options){
        options = {goal: true, branch: "goal"};
      }
      // setdata
        $rootScope.setData(goal, actions, null, $rootScope.data.outlook, options);
      // function(goals, actions, progress, outlook, options)
    }

    $rootScope.setActiveAction = function(action){
      // find goal
      var goals = [];
      var actions = [];
      actions.push(action);

      for (var i = 0; i < $rootScope.data.dashboard.goal.length; i++) {

        if ($rootScope.data.dashboard.goal[i]._id == action._goalid){
          goals.push($rootScope.data.dashboard.goal[i]);
          break;
        }
      };

      var options = {branch: "action"};
      $rootScope.setData(goals, actions, null, $rootScope.data.outlook, options);

    }
    // Logout function is available in any pages
    $rootScope.logout = function(){
      $rootScope.user = {};
      $rootScope.message = 'Logged out.';
      $http.post('/logout');
    };

    $rootScope.toggleMenu = function(id) {
      $mdSidenav(id).toggle();
    };

    // http://stackoverflow.com/questions/122102/what-is-the-most-efficient-way-to-clone-an-object
    $rootScope.clone = function(obj) {
      if (obj === null || typeof(obj) !== 'object' || 'isActiveClone' in obj)
        return obj;

      if (obj instanceof Date)
        var temp = new obj.constructor(); //or new Date(obj);
      else
        var temp = obj.constructor();

      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          obj['isActiveClone'] = null;
          temp[key] = $rootScope.clone(obj[key]);
          delete obj['isActiveClone'];
        }
      }

      return temp;
    }
  });


/**********************************************************************
 * Login controller
 **********************************************************************/
app.controller('LoginCtrl', function($scope, $rootScope, $http, $location, DataService) {
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
      $location.url('/dashboard');
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
      $location.url('/#/dashboard');
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

    $scope.resetPassword = function(){
      var body = {recipient: $scope.user.username};
      DataService.resetPassword(body)
        .success(function(res){
          console.log('resetPassword success:' + res);
        })
        .error(function(err){
          console.log('resetPassword failed: ' + err);
        });
    }
});


/**********************************************************************
 * dashboard controller
 **********************************************************************/
app.controller('DashboardCtrl', function(DataService, $scope, $http, $mdSidenav, $timeout, $rootScope) {

  $rootScope.busy=true;
  // $rootScope.data.outlook = 7;

  var options = {branch: 'dashboard'};

  DataService.loadData($rootScope.data.outlook, $rootScope.setData, options);

  $scope.$watch('data.outlook', function() {
    DataService.updateOutlook($rootScope.data.dashboard.goal, $rootScope.data.dashboard.action, $rootScope.data.outlook);
  });

  $scope.incrementProgress = function(action){
    DataService.postProgress($rootScope.data.dashboard.action, action, 1, $rootScope.data.outlook);
  };

  $scope.completeGoal = function(goal){
    var body = {status: "Closed - Complete", }
    // DataService.setOutlook(outlook);
    DataService.putGoal(goal, body);
  };

});

/**********************************************************************
 * goal controller
 **********************************************************************/
app.controller('GoalCtrl', function(DataService, $scope, $http, $mdSidenav, $timeout, $rootScope) {

// $scope.outlook = 7;
// $scope.preEditGoal = Object.assign({}, $rootScope.activeGoal);
// $scope.editGoal = Object.assign({}, $rootScope.activeGoal);

  $scope.showEditButtons = false;


  $scope.updateStatus = function(){
    $rootScope.activeGoal.status = $rootScope.statusList[1];
  }


  $scope.save = function(){
    console.log('save');
    // put api
    var goals = [];
    $rootScope.data.activeGoal.goal.date_modified = new Date(Date.now());
    goals.push($rootScope.data.activeGoal.goal);

    DataService.putGoal($rootScope.data.activeGoal.goal)
      .success(function(res){
        console.log('putgoal success: ' + res);
        DataService.prepareGoalData(goals, $rootScope.data.outlook);
        $scope.showEditButtons = false;
      })
      .error(function(err){
        console.log('putgoal error: ' + err);
      });
  }

  $scope.cancel = function(){

      $rootScope.data.activeGoal.goal.description = $rootScope.data.activeGoal.preEdit.description;
      $rootScope.data.activeGoal.goal.due         = new Date($rootScope.data.activeGoal.preEdit.due);
      $rootScope.data.activeGoal.goal.status      = $rootScope.data.activeGoal.preEdit.status;
      $rootScope.data.activeGoal.goal.is_public   = $rootScope.data.activeGoal.preEdit.is_public;
      $rootScope.data.activeGoal.goal.date_created = new Date($rootScope.data.activeGoal.preEdit.date_created);
      $rootScope.data.activeGoal.goal.date_modified = new Date($rootScope.data.activeGoal.preEdit.date_modified);

      $scope.showEditButtons = false;
  }

  $scope.goalDataChanged = function(){
    $scope.showEditButtons = true;
  }

  $scope.$watch('data.outlook', function() {
    DataService.updateOutlook($rootScope.data.activeGoal.goal, $rootScope.data.activeGoal.action, $rootScope.data.outlook);
  });

// Increment progress
  $scope.incrementProgress = function(action){
    DataService.postProgress($rootScope.data.activeGoal.action, action, 1, $rootScope.data.outlook);
  };
  
});

/**********************************************************************
 * action controller
 **********************************************************************/
app.controller('ActionCtrl', function(DataService, $scope, $http, $mdSidenav, $timeout, $rootScope) {

$scope.$watch('data.outlook', function() {
    DataService.updateOutlook($rootScope.data.activeAction.goal, $rootScope.data.activeAction.action, $rootScope.data.outlook);
  });

$scope.incrementProgress = function(action){
    DataService.postProgress($rootScope.data.activeAction.action, action, 1, $rootScope.data.outlook);
  };

$scope.decrementProgress = function(action){
    DataService.postProgress($rootScope.data.activeAction.action, action, -1, $rootScope.data.outlook);
  };

$scope.actionDataChanged = function(){
  $scope.showEditButtons = true;
}

$scope.cancel = function(){

      $rootScope.data.activeAction.action[0].is_public = $rootScope.data.activeAction.preEdit.is_public;
      $rootScope.data.activeAction.action[0].status[$rootScope.data.activeAction.action[0].status.length-1].on = $rootScope.data.activeAction.preEdit.status[$rootScope.data.activeAction.preEdit.status.length-1].on;

      $scope.showEditButtons = false;
}

  $scope.save = function(){
    console.log('save');
    // put api
    var actions = $rootScope.data.activeAction.action;
    actions[0].date_modified = new Date(Date.now());

    DataService.putAction(actions[0])
      .success(function(res){
        console.log('putAction success: ' + res);
        DataService.prepareActionData(actions, $rootScope.data.outlook);
        $scope.showEditButtons = false;
      })
      .error(function(err){
        console.log('putAction error: ' + err);
      });
  }
});

/**********************************************************************
 * tracking controller
 **********************************************************************/
app.controller('TrackingCtrl', function(UserFactory, GoalFactory, ActionFactory, GoalActionProgressFactory, ProgressFactory, $scope, $http, periodInWordsFilter, $filter, $mdSidenav, $timeout, $rootScope) {
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
  $scope.filter.action.statusOn = true
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
  $scope.createAction = function(_goalid, verb, verb_quantity, noun, period, due, statusOn, is_public){
    // $scope.goal to find goal, splice(0,0, action)
    // var action = {_goalid: goalid, verb: verb, verb_quantity: verb_quantity, noun: noun, period: period, due: due};
    var now = new Date(Date.now());
    status = status.trim();

    console.log('input: _goalid: ' + _goalid + ' verb_quantity: ' + verb_quantity);
    ActionFactory.post(_goalid, verb, verb_quantity, noun, period, due, now, statusOn, is_public)
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
  }

$scope.prepareData = function(action){

  var periodLengthMilliseconds = action.period * $rootScope.millisecondsInDay;
  var startDate = new Date(action.date_created);
  var startDateMilliseconds = startDate.getTime();
  var compareDateMilliseconds = Date.now();
  var totalPeriodsIncludingCurrent = Math.ceil((compareDateMilliseconds - startDateMilliseconds)/periodLengthMilliseconds);
  var daysRemaining = Math.ceil((startDateMilliseconds + (periodLengthMilliseconds * totalPeriodsIncludingCurrent) - compareDateMilliseconds)/$rootScope.millisecondsInDay);
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

  for (var i = 0; i < totalPeriodsIncludingCurrent; i++) {
    var value = {x: i+1, y: 0};
    action.chart.data[0].values.push(value);
  };

  for (var i = 0; i < action.summary.length; i++) {
    var period = action.summary[i].period;
    action.chart.data[0].values[period-1].y = action.summary[i].progress;
  };

  action.currentProgress = currentProgress;

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
app.controller('RootCtrl', ['$scope', '$rootScope', '$location', '$mdSidenav', function($scope, $rootScope, $location, $mdSidenav) {
  // $scope.menu = MenuService.menu;
  // $scope.newItem = $scope.menu.length;

  $scope.toggleMenu = function(id) {
    $mdSidenav(id).toggle();
  };

  $scope.pagename = function() { return $location.path(); };

  // $scope.addItem = function() {
  //   MenuService.add( $scope.newItem );  
  //  };

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

app.controller('AnalyticsCtrl2',['DataService', '$scope', '$rootScope', function(DataService, $scope, $rootScope) {

  // console.log('outlook updated...');
  $scope.data = $rootScope.data;
  // console.log();

}]);

app.controller('AnalyticsCtrl',['DataService', '$scope', '$rootScope', function(DataService, $scope, $rootScope) {
  $scope.data = $rootScope.data;
  $scope.outlook = 7;
  DataService.setOutlook($scope.outlook);
  DataService.goalTotals();
  $scope.data = DataService.getData();
  console.log($scope.data);

  $scope.$watch('outlook', function() {
    // console.log('outlook updated...');
    DataService.updateOutlook($scope.outlook);
    // console.log($rootScope.data);
  });

  $scope.loadDataToRootScope = function(){
    DataService.loadData($scope.outlook); // TODO: use promise instead?
    // console.log($rootScope.data);
  }

  // $scope.updateOutlook = function(){
  //   DataService.setOutlook($scope.outlook);
  // }


}]);
  
app.controller('listCtrl',['DataService', '$scope', '$rootScope', function(DataService, $scope, $rootScope) {

  $scope.filter = {};
  $scope.filter.goal = {
    open: true,
    closedComplete: true,
    closedIncomplete: true,
    is_public: true,
    is_private: true
  };

  $scope.filter.action = {
    on: true,
    off: true,
    is_public: true,
    is_private: true
  };

  $scope.incrementProgress = function(action){
    DataService.postProgress($rootScope.data.dashboard.action, action, 1, $rootScope.data.outlook);
  };

  $scope.completeGoal = function(goal){
    var body = {status: "Closed - Complete", }
    // DataService.setOutlook(outlook);
    DataService.putGoal(goal, body);
  };

}]);

app.controller('createCtrl', ['$scope', 'DataService', '$mdSidenav', '$rootScope', '$location', function($scope, DataService, $mdSidenav, $rootScope, $location){


  // var goal = {};
  // var action = {};

  // // Set goal defaults
  // goal.is_public = false;
  // goal.status = "Open";

  var url = $location.url();

  $scope.methods = {
    // called on action tab click to load goals
    initialise: function(){
      console.log('initialising...');
      $scope.data.goals = $rootScope.data.dashboard.goal;
      console.log($scope.data.goals);
    },
    resetScopeData: function(){

        var goalid = '';
        var goalSelected = '';
        var selectedIndex = 0;

        if (url == "/goal") {
         goalid = $rootScope.data.activeGoal.goal._id;
         selectedIndex = 1;
        };

        var dueDate = new Date();
        $scope.data = {
          selectedIndex: selectedIndex,
          goal: {
            statusList: $rootScope.statusList,
            description: '',
            due: dueDate,
            is_public: false,
            status: 'Open'
          },
          action: {
            goalSelected: goalid,
            _goalid     : goalid,
            is_public   : false,
            verb        : '',
            verb_quantity : 1,
            noun        : '',
            period      : 7, // TODO: Store period as Number, apply Angular filter clientside to show 'every month' for 30 days, 'every week' for 7 days, 'every 120 days' for 120 day custom period. 0: one time
            // due         : Date,
            // summary     : [], // [{period: 1, progress: 2}, {period: 2, progress: 3}]. Similar to how Angular nvD3 requires data format
            statusOn      : true, // [{date: '2016-01-01', on: true}, {date: '2016-02-01', on: false}]
          }
        }

        $scope.data.goals = $rootScope.data.dashboard.goal;
    },
    toggleMenu: function(id) {
      $mdSidenav(id).toggle();
    },
    saveGoal: function(description, status, is_public, due){
      
      // validate
      if (!description || description == '' || (!status) || status == '' || (!due)){
        return null;
      }

      var dueDate = new Date(due);
      var goal = {description: description, status: status, is_public: is_public, due: dueDate};

      DataService.saveGoal(goal)
        .success(function(res){
          $rootScope.data.dashboard.goal.push(goal);
          DataService.updateOutlook($rootScope.data.dashboard.goal, $rootScope.data.dashboard.action, $rootScope.data.outlook);
          $scope.methods.resetScopeData();

        })
        .error(function(err){

        });

      console.log('save goal');
    },
    saveAction: function(goalid, verb, verb_quantity, noun, period, is_public, statusOn){
      var action = {_goalid: goalid, verb: verb, verb_quantity: verb_quantity, noun: noun, period: period, is_public: is_public, statusOn: statusOn};

      // action to push to rootscope
      var summary = [];
      var now = new Date(Date.now());
      var status = [{date: now, on: statusOn}];
      var adjustedAction = {_goalid: goalid, verb: verb, verb_quantity: verb_quantity, noun: noun, period: period, is_public: is_public, summary: summary, status: status, date_created: now, date_modified: now};

      // validation
      if (!goalid || goalid == '' || !verb || verb == '' || !verb_quantity || verb_quantity == '' || !noun || noun == '' || !period || period == '') {
        console.log('saveAction validation error');
        return null;
      };

      // save api
      DataService.saveAction(action)
        .success(function(res){
          $rootScope.data.dashboard.action.push(adjustedAction);
          $scope.methods.resetScopeData();

          // activeGoal indicates whether the user created the action from its respective goal page
          if ($rootScope.data.activeGoal.goal._id == goalid) {
            var goal = {};
            var options = {goal: false, branch: 'goal'}; // don't update activeGoal.goal, it's just activeGoal.action we want updating
            goal._id = goalid; 
            $rootScope.data.activeGoal.action.push(adjustedAction);
            $rootScope.setActiveGoal(goal, options);
          };

          DataService.updateOutlook($rootScope.data.dashboard.goal, $rootScope.data.dashboard.action, $rootScope.data.outlook);
          DataService.updateOutlook($rootScope.data.activeGoal.goal, $rootScope.data.activeGoal.action, $rootScope.data.outlook);

        })
        .error(function(err){
          console.log('could not create action:');
          console.log(err);
        });
    }
  }

  $scope.methods.resetScopeData();

}]);


app.controller('settingsCtrl', ['$scope', 'DataService', '$mdSidenav', '$rootScope', '$location', function($scope, DataService, $mdSidenav, $rootScope, $location){

  $scope.methods = {
      // ToDo this is duplicated multiple times, is there a way of accessing rootscope function from selfcontained directive?
      toggleMenu: function(id) {
        $mdSidenav(id).toggle();
      }
    }

}]);

app.controller('settingsGoalCtrl', ['$scope', 'DataService', '$mdSidenav', '$rootScope', '$location', function($scope, DataService, $mdSidenav, $rootScope, $location){
  
  $scope.data = {
    delete: {
      message: "Delete goal"
    }
  }

  $scope.methods = {
    // TODO: house all actions belonging to deleted goals in 'Deleted goals' goal so they can be
    //  picked up in All goals and actions view
    delete: function(){
      console.log('delete goal');
      DataService.deleteGoal($rootScope.data.activeGoal.goal)
        .success(function(res){
          console.log('deleted goal: ' + res);
          $location.url('/dashboard');

          //TODO flash success message
        })
        .error(function(err){
          console.log('could not delete goal: ' + err);
        })
    },
    toggleMenu: function(id) {
      $mdSidenav(id).toggle();
    }
  }

}]);

app.controller('settingsActionCtrl', ['$scope', 'DataService', '$mdSidenav', '$rootScope', '$location', function($scope, DataService, $mdSidenav, $rootScope, $location){

  $scope.data = {
    delete: {
      message: "Delete action"
    }
  }

  $scope.methods = {
    delete: function(){
      console.log('delete action');
      DataService.deleteAction($rootScope.data.activeAction.action[0])
        .success(function(res){
          console.log('deleted action: ' + res);
          $location.url('/dashboard');
          // DataService.updateOutlook($rootScope.data.activeAction.goal,$rootScope.data.activeAction.action,$rootScope.data.outlook);
          // DataService.updateOutlook($rootScope.data.activeGoal.goal,$rootScope.data.activeGoal.action,$rootScope.data.outlook);

          // Todo: history.back(); but with updated data

          //TODO flash success message
        })
        .error(function(err){
          console.log('could not delete action: ' + err);
        })
    },
    toggleMenu: function(id) {
      $mdSidenav(id).toggle();
    }
  }

}]);

// FACTORIES AND SERVICES
app.factory("DataService", ['$rootScope', '$http', '$filter', function($rootScope, $http, $filter) {

  var dataSet = [];
  //functions defined within a JSON object so they're accessible to eachother
  var functions = {
    resetPassword: function(email){
      return $http.post('/api/v1/resetPassword', email);
    },
    deleteAction: function(action){
      return $http.delete('/api/v1/action/' + action._id);
    },
    deleteGoal: function(goal){
      return $http.delete('/api/v1/goal/' + goal._id);
    },
    putAction: function(action){
      return $http.put('/api/v1/action/' + action._id, action);
    },
    putGoal: function(goal){
      return $http.put('/api/v1/goal/' + goal._id, goal);
    },
    saveGoal: function(goal){
      return $http.post('/api/v1/goal', goal);
    },
    saveAction: function(action){
      return $http.post('/api/v1/action', action);
    },
    prepareActionData: function(actions, outlook){
        var total = 0;
        var on = 0;
        var off = 0;
        // var outlook = $rootScope.data.outlook;
        var repetition = 0;
        var rep_complete = 0;
        var rep_conversion = 0;
        var temp_rep_total = 0;
        var temp_rep_complete = 0;
        var temp_repetition = 0;
        var outlookDate = new Date(Date.now() - (outlook * $rootScope.millisecondsInDay));
        var action_date_created = new Date();
        var progress_date = new Date();
        var max_repetition = 0;
        var days_since_created = 0;
        var days_since_modified = 0;
        var today = new Date(Date.now());

        var actionDurOn = 0;

        for (var i=0; i < actions.length; i++){
          
          var action = actions[i];

          //set date objects from strings
          action.date_modified = new Date(action.date_modified);
          action.date_created = new Date(action.date_created);

          for (var j = 0; j < action.status.length; j++) {
            action.status[j].date = new Date(action.status[j].date);
          };
          // vars from prepareData
          var periodLengthMilliseconds = action.period * $rootScope.millisecondsInDay;
          var startDate = new Date(action.date_created); // use action.date_created
          var startDateMilliseconds = startDate.getTime();
          var compareDateMilliseconds = Date.now();
          var totalPeriodsIncludingCurrent = Math.ceil((compareDateMilliseconds - startDateMilliseconds)/periodLengthMilliseconds);
          var remainingDays = Math.ceil((startDateMilliseconds + (periodLengthMilliseconds * totalPeriodsIncludingCurrent) - compareDateMilliseconds)/$rootScope.millisecondsInDay);
          action.remainingDays = remainingDays;
          
          var deadline = new Date(startDateMilliseconds + (totalPeriodsIncludingCurrent * periodLengthMilliseconds));
          action.deadline = deadline;
          action.currentPeriod = totalPeriodsIncludingCurrent;

          var totalPeriodsExcludingCurrent = totalPeriodsIncludingCurrent - 1; // if totalPeriodsIncludingCurrent = 0?

          var startCurrentPeriod = new Date(startDateMilliseconds + (periodLengthMilliseconds * totalPeriodsExcludingCurrent));
          var endCurrentPeriod = new Date(startDateMilliseconds + (periodLengthMilliseconds * totalPeriodsIncludingCurrent));
          var currentProgress = 0;

          // check most recent status
          if (action.status[action.status.length-1].on == true){
            on += 1;
            total += 1;  
          }
          else if (action.status[action.status.length-1].on == false){
            off += 1;
            total += 1;  
          }
          // Total, On, Off


          // handle case where no current period progress
          // only calculate currentProgress if it's not already been calculated
          // the user may have incremented currentProgress so we don't want to lose this value
          // whenever updateScope is called (which in turn calls this function)
          if (!action.currentProgress){
            for (var j = action.summary.length - 1; j >= 0; j--) {
              if (action.summary[j].period == action.currentPeriod) {
                currentProgress = action.summary[j].progress;
                break;
              };
            };
            action.currentProgress = currentProgress;
          }

          // create values array for nvd3 graph
          action.chart = [];
          action.chart.xAxisLabel = $filter('periodInWords')(action.period, 1) + ' since ' + $filter('date')(action.date_created, "dd MMM, yyyy");
          action.chart.data = [{key: 'progress', values: []}];

          for (var j = 0; j < totalPeriodsIncludingCurrent; j++) {
            var value = {x: j+1, y: 0};
            action.chart.data[0].values.push(value);
          };

          for (var j = 0; j < action.summary.length; j++) {
            var period = action.summary[j].period;
            action.chart.data[0].values[period-1].y = action.summary[j].progress;
          };


          action.chart.options = {
                      chart: {
                          type: 'multiBarChart',
                          showControls: false,
                          showLegend: false,
                          height: 250,
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

          // calculate repetition, rep_complete, both at the individual action level and running total
          // having these stats at the individual action level means they're available for when user drills down into the action detail view.

          for (var j=0; j < actions[i].summary.length; j++){
            // compare outlook date to period. Todo.
            // action_date_created = new Date(data.action[i].date_created + )
            // f (period, created);
            progress_date = new Date(action.date_created.getTime() + (actions[i].period * actions[i].summary[j].period * $rootScope.millisecondsInDay));

            if (outlookDate < progress_date){
              temp_rep_complete += actions[i].summary[j].progress;

              // console.log('progress...');
              // console.log(actions[i]);
            }
          }

          actions[i].summary.totalProgress = temp_rep_complete;
          rep_complete += temp_rep_complete;

          // actionDurationOn
          // totalRepetitions depend on whether the action was 'on' or 'off'
          var dateRange = {start: outlookDate, end: today};
          actionDurOn = Math.ceil(functions.actionDurationOn(actions[i], dateRange));
          console.log('actionDurOn: ' + actionDurOn);

          actions[i].summary.totalRepetition = Math.ceil((action.verb_quantity/action.period)*actionDurOn); // since action.period is per day, we can multiply by outlook to get expected total reps over day range
          
          temp_repetition += actions[i].summary.totalRepetition; // max rep = rep per day * days since created

          repetition += temp_repetition;
          // clear temp vars
          temp_rep_total = 0;
          temp_rep_complete = 0;
          temp_repetition = 0;
        }

        // cap max rep
        
        // calculate rep_conversion
        // if repetition == 0 .. waiting for more data
        if (repetition==0){ rep_conversion = ''}
        else { rep_conversion = Math.round((rep_complete/repetition)*100); }

        actions.total = {};

        actions.total.total = total;
        actions.total.on = on;
        actions.total.off = off;
        actions.total.repetition = repetition;
        actions.total.rep_complete = rep_complete;
        actions.total.rep_conversion = rep_conversion;

        return actions;
    },
    prepareGoalData: function(goals, outlook){
      var open = 0;
      var closed = 0;
      var complete = 0;
      var outlookDate = new Date(Date.now() - (outlook * $rootScope.millisecondsInDay));

      for (var i=0; i < goals.length; i++){
        
        var goal = goals[i];
        goal.date_created = new Date(goal.date_created);
        goal.date_modified = new Date(goal.date_modified);
        goal.due = new Date(goal.due);
        // calculate days remaining
        goal.remainingDays = functions.daysRemaining(null, goal.due);

        // calculate open, closed, complete
        if (goal.status == 'Open'){
          open += 1;  
        }
        else if ((goal.status == 'Closed - Complete') && (outlookDate < goal.date_modified)){
          complete += 1;
          closed += 1;
        }
        else if ((goal.status == 'Closed - Incomplete') && (outlookDate < goal.date_modified)){
          closed += 1;
        }
      }

      goals.total = {};
      goals.total.open = open;
      goals.total.closed = closed;
      goals.total.complete = complete;
    },
    setOutlook: function(outlook){
      $rootScope.data.outlook = outlook;
    },
    getData: function(){
      return dataSet;
    },
    actionDurationOn: function(action, dateRange){

      // calculates the duration in days an action has been switched on between a date range
      var durationOn = 0;

      var s = dateRange.start;
      var e = dateRange.end;

      var A = []; // actions before s
      var B = []; // actions between s and e

      var k = 0;
      var r = 0;
      var isEven = false; // |B| is even
      var N = 0; // = |B|

      var msd = 86400000; //ms in day

      // populate A and B with action.status
      for (var i = 0; i < action.status.length; i++) {

        if (action.status[i].date < s)
        {
          A.push(action.status[i]);
        }
        else if (action.status[i].date > s && action.status[i].date < e)
        {
          B.push(action.status[i]);
        };
      };

      // alpha
      if (A.length > 0 && A[A.length-1].on == true){

        if (B.length > 0) {
          durationOn += B[0].date - s;
        } else {
          durationOn += e - s;
        }
      }

      // beta
      if (B.length > 0 && B[B.length-1].on == true) {
        durationOn += e - B[B.length-1].date;
      };

      // gamma
      if (B.length > 2 || (B.length == 2 && B[0].on == false)) {

        // initialise formula variable r
        if (B[0].on == false) {
          r = 1;
        } else {
          r = 0;
        }

        // even/odd number of B elements - required for obtaining k
        N = B.length;

        (N % 2 == 0) ? (isEven = true) : (isEven = false);

        // initialise formula variable k
        switch (true){
          case (N > 1 && isEven == true && B[0].on == true):
            k = (N / 2) - 1;
            break;
          case (N > 2 && isEven == false):
            k = ((N - 1)/2) - 1;
            break;
          case (N > 3 && isEven == true && B[0].on == false):
            k = (N / 2) - 2;
            break;
          default:
            k = -1; // do not loop
            break;
        }

        if (k >= 0){
          for (var i = 0; i < k + 1; i++) {
            // console.log('loop: ' + i);
            durationOn += B[(2*i) + 1 + r].date - B[(2*i) + r].date;
          };
        }

      };

      return durationOn/msd; // return days instead of milliseconds

    },
    loadData: function(outlook, callback, options){
      $http.get('/api/v1/goalsActionsProgress')
        .success(function(doc){
            console.log('before loaded goal:');
            console.log(goals);

            var goals = doc[0];
            var actions = doc[1];
            var progress = doc[2];

             console.log('Loaded Goals, Actions, Progress data');
             console.log(goals);

             // initialise default values
            // goals.total = {open: 0, closed: 0, complete: 0};
            // actions.total = {open: 0, closed: 0, complete: 0, repetition: 0, rep_complete: 0, rep_conversion: 0};
            // $rootScope.data.outlook = 7;
            
            // set date format

            // update totals/stats
            dataSet = functions.updateOutlook(goals, actions, outlook);
            console.log(dataSet);
            callback(goals, actions, progress, outlook, options);
            // return dataSet;
        })
        .error(function(error){
          console.log('Error loading Goals, Actions, Progress data');
        })
    },
    //TODO: generalise to operate on not just on rootscope.data.action, etc. but rather function (goal, action, outlook)
    updateOutlook: function(goals, actions, outlook){


      functions.setOutlook(outlook);

      // can use null to not prepareGoalData
      if (goals && outlook){
        functions.prepareGoalData(goals, outlook);
      }

      if (actions && outlook) {
        functions.prepareActionData(actions, outlook);
      };

      $rootScope.busy = false;

      var dataSet = {goals: goals, actions: actions, outlook: outlook};
      console.log('dataSet:');
      console.log(dataSet);
      return dataSet;
    },
    daysRemaining: function(startDate, endDate){
      var start = new Date(startDate);
      var end = new Date();
      var daysDiff = 0;

      if (startDate){ start = new Date(startDate);}
      else { start = new Date(Date.now());}

      if (endDate){ end = new Date(endDate);}
      else { end = new Date(Date.now());}

      daysDiff = Math.ceil((end.getTime() - start.getTime())/$rootScope.millisecondsInDay); // TODO: use const global
      return daysDiff;
    },
    // CRUD goals and actions
    postProgress: function(actions, action, progress, outlook){
    $rootScope.busy = true;

    var body = {_actionid: action._id, counter: progress}
    body.date_modified = new Date(Date.now());

    $http.post('/api/v1/progress', body)
      .success(function (res){
        console.log('ProgressFactory success: ' + JSON.stringify(res));
        console.log(action);
        action.currentProgress += progress;
        action.chart.data[0].values[action.currentPeriod-1].y += progress;
        action.date_modified = body.date_modified; // necessary?

        // attempt at bug fix: progress not updating after creating/updating new action
        if (action.summary.length == 0){
          action.summary = [{progress: 0, period: 1}];
        }

        //increment action scope
        for (var j = action.summary.length - 1; j >= 0; j--) {
          if (action.summary[j].period == action.currentPeriod) {
            action.summary[j].progress += progress;
            break;
          };
        };

        // TODO prepare across multiple locations: use options obj? prepareActionData across data.dashboard.action, data.activeGoal.action, and data.activeAction.action
        functions.prepareActionData(actions, outlook);

        $rootScope.busy = false;
      })
      .error(function(error){
        console.log('ProgressFactory error: ' + JSON.stringify(error));
        $rootScope.busy = false;
      });
  }
  // ,
  // putGoal: function(goal, body){
  //   $rootScope.busy = true;
  //   // add current datetime to date_modified
  //   body.date_modified = new Date(Date.now());

  //   $http.put('/api/v1/goal/' + goal._id, body)
  //     .success(function(res){
  //       console.log('put goal' + JSON.stringify(goal));
  //       if (body.status){goal.status = body.status};
  //       goal.date_modified = body.date_modified;

  //       var options = {branch: 'goal', goal: false};
  //       $rootScope.setActiveGoal(goal, options)
  //       $rootScope.busy = false;
  //     })
  //     .error(function(err){
  //       console.log('error put goal: ' + err);
  //       $rootScope.busy = false;
  //     });
  // }
}
return functions;
}]);

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
    post: function(_goalid, verb, verb_quantity, noun, period, due, date_created, statusOn, is_public){
      var body = {_goalid: _goalid, verb: verb, verb_quantity: verb_quantity, noun: noun, period: period, due: due, date_created: date_created, statusOn: statusOn, is_public: is_public};
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

app.filter('is_publicFormat', function() {
  return function(is_public) {
    return (is_public == 0) ? 'Private' : 'Public';
  };
});

app.filter('statusFilter', function() {
  return function(status) {
    return (status == true) ? 'On' : 'Off';
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
app.directive('createSidenav', function() {
  return {
    restrict: 'E',
    scope: {
      f: '=f',  // functions or methods
      d: '=d'   // data
    },
    templateUrl: 'views/create-sidenav.html'
  };
});

app.directive('settingsSidenav', function() {
  return {
    restrict: 'E',
    scope: {
      f: '=f',  // functions or methods
      d: '=d'   // data
    },
    templateUrl: 'views/settings-sidenav.html'
  };
});

app.directive('settingsGoalActionSidenav', function() {
  return {
    restrict: 'E',
    scope: {
      f: '=f',  // functions or methods
      d: '=d'   // data
    },
    templateUrl: 'views/settings-goalActionSidenav.html'
  };
});