'use strict';

 /**
 * ANGULAR APP
 * @constructor
 */
var app = angular.module('app', ['ngResource', 'ngRoute', 'ngAnimate', 'ngAria', 'ngMaterial', 'ngMdIcons', 'nvd3'])
  .config(function($routeProvider, $locationProvider, $httpProvider, $mdThemingProvider) {

    var darkBlueMap = $mdThemingProvider.extendPalette('blue', {
      '500': '3470ce'
    });
    // Register the new color palette map with the name 'darkBlue'
    $mdThemingProvider.definePalette('darkBlue', darkBlueMap);
    // Use that theme for the primary intentions
    $mdThemingProvider.theme('default')
      .primaryPalette('darkBlue')
      
    /**
    * Supply required data depending on whether the use is logged in and looking at their own page
    * @param {Promise} $q - resolve once data is provided
    */
    var supplyRequiredData = function($q, $rootScope, $location, DataService){

      console.log('SUPPLY REQUIRED DATA');
      $rootScope.busy = true;
      var userUri = $location.url().split('/')[1];
      var deferred = $q.defer();

      // check if user has been loggin in via social provider
      if($location.search()['loginSource']){
        // loggedInAsId                   = userUri;
        $rootScope.data.loggedInAs._id = userUri;
        $rootScope.data.loggedInAs.first_name = $location.search()['first_name'];
        $rootScope.data.loggedInAs.picture_url = $location.search()['picture_url'];
        $location.search('loginSource', null); // clear param once done with
        $location.search('first_name', null); // clear param once done with
        $location.search('picture_url', null); // clear param once done with

        // save user to localstorage in case rootscope is wiped, e.g. page refresh
        var lsUser = JSON.stringify({_id: $rootScope.data.loggedInAs._id, first_name: $rootScope.data.loggedInAs.first_name, picture_url: $rootScope.data.loggedInAs.picture_url});
        localStorage.setItem('loggedInAs', lsUser);
      }

      // check localStorage to see if user persists
      var lsUser = localStorage.getItem('loggedInAs');
      if (lsUser){
        lsUser = JSON.parse(lsUser);
        $rootScope.data.loggedInAs = {_id: lsUser._id, first_name: lsUser.first_name, picture_url: lsUser.picture_url};
      }

      if ($rootScope.data.loaded===''){

        if ($rootScope.data.loggedInAs._id===''){
          loadPublicData($rootScope, $location, DataService, userUri, deferred);
        } else {
          (userUri===$rootScope.data.loggedInAs._id) ? loadPrivateData($rootScope, DataService, deferred) : loadPublicData($rootScope, $location, DataService, userUri, deferred);
        }
      }
      else {

        if ($rootScope.data.loggedInAs._id===''){
          (userUri===$rootScope.data.loaded) ? (resolvePromise(deferred)) : loadPublicData($rootScope, $location, DataService, userUri, deferred);
        } else {
          
          if (userUri===$rootScope.data.loaded){
            resolvePromise(deferred);
          } else {
            (userUri===$rootScope.data.loggedInAs._id) ? loadPrivateData($rootScope, DataService, deferred) : loadPublicData($rootScope, $location, DataService, userUri, deferred)
          }
        }
      }
    }

    var resolvePromise = function(deferred){
      deferred.resolve();
      return deferred.promise;
    }

    var loadPublicData = function($rootScope, $location, DataService, userUri, deferred){
      DataService.loadPublicData(userUri)
      .success(function(res){

        // res returns [goals, actions, progress, user]
        $rootScope.setData(res[0], res[1], res[2], res[3], null);
        DataService.updateOutlook(res[0], res[1], $rootScope.data.outlook);
        $rootScope.busy = false;
        console.log('LOADPUBLICDATA');
        deferred.resolve();
        return deferred.promise;
      })
      .error(function(err){

        $rootScope.data.message = err;
        $rootScope.busy = false;

        deferred.reject();

        // redirect to 404
        $location.path('/404');

        return deferred.promise;
      });
    };

    var loadPrivateData = function($rootScope, DataService, deferred){
      DataService.loadPrivateData()
        .success(function(res){

        // res returns [goals, actions, progress, user]
        $rootScope.setData(res[0], res[1], res[2], res[3], null);
        DataService.updateOutlook(res[0], res[1], $rootScope.data.outlook);
        $rootScope.busy = false;

        console.log('LOADPRIVATEDATA');
        deferred.resolve();
        return deferred.promise;
      })
      .error(function(err){

        $rootScope.busy = false;
        deferred.reject();
        return deferred.promise;
      });
    };

    var checkLoggedin = function($http){
      // Initialize a new promise

      // Make an AJAX call to check if the user is logged in
      $http.get('/loggedin')
        .success(function(user){
          // Authenticated
          if (user !== '0'){

          }
          // Not Authenticated
          else {
            // clear lsUser if exists
            var lsUser = localStorage.getItem('loggedInAs');
            if (lsUser){
              localStorage.removeItem('loggedInAs');
            }

            $rootScope.data.loggedInAs = {_id:'', first_name: '', picture_url: ''};
          }
        })
        .error(function(err){

        });
    };

    /**
    * Intercept AJAX calls and handle errors (send to login page)
    */
    $httpProvider.interceptors.push(function($q, $location, $rootScope) {
      return {
        response: function(response) {
          // do something on success
          return response;
        },
        responseError: function(response) {

          if (response.status === 401)
            // unauthorized
            $location.url('/login');
          return $q.reject(response);
        }
      };
    });

    /**
    * ROUTES - Define all routes and associated views and controllers
    */
    $routeProvider
      .when('/', {
        templateUrl: '/views/main.html'
      })
      .when('/login', {
        templateUrl: 'views/login.html',
        controller: 'LoginCtrl'
      })
      .when('/signup', {
        templateUrl: 'views/signup.html',
        controller: 'SignupCtrl'
      })
      .when('/:userId/goal/:goalId', {
        templateUrl: 'views/goal.html',
        controller: 'GoalCtrl',
        resolve:{
          data: supplyRequiredData
        }
      })
      .when('/:userId/action/:actionId', {
        templateUrl: 'views/action.html',
        controller: 'ActionCtrl',
        resolve:{
          data: supplyRequiredData
        }
      })
      .when('/:userId/list', {
        templateUrl: 'views/list.html',
        controller: 'ListCtrl',
        resolve:{
          data: supplyRequiredData
        }
      })
      .when('/:userId/dashboard', {
        templateUrl: 'views/dashboard.html',
        controller: 'DashboardCtrl',
        resolve:{
          data: supplyRequiredData
        }
      })
      .when('/:userId/profile', {
        templateUrl: 'views/profile.html',
        controller: 'ProfileCtrl',
        resolve:{
          data: supplyRequiredData
        }
      })
      .when('/404', {
        templateUrl: 'views/404.html',
        controller: '404Ctrl'        
      })
      .otherwise({
        redirectTo: '/'
      });
    //================================================

  }) // end of config()

  .run(function($rootScope, $http, $location, $mdSidenav, DataService){

    // triggered when page refreshed too
    $rootScope.location = $location;
    $rootScope.message = '';
    $rootScope.millisecondsInDay = 86400000;
    $rootScope.busy = false;
    $rootScope.runLoaded = false;
    $rootScope.statusList = ['Open', 'Closed - Complete', 'Closed - Incomplete'];

    // init data structure if not already done so
    if (!$rootScope.data){
      $rootScope.data = [];
      $rootScope.data.loaded = '';
      $rootScope.data.outlook = 7;
      $rootScope.data.loggedInAs = {_id: '', first_name: '', picture_url: ''};
      $rootScope.data.user = {_id: ''};
    }

    $rootScope.setData = function(goals, actions, progress, user, options){

      $rootScope.data.goal      = goals;
      $rootScope.data.action    = actions;
      $rootScope.data.progress  = progress;
      $rootScope.data.user      = user;
      $rootScope.data.loaded    = user._id;
    }

    /**
    * Sets active goal i.e. sets the property goal['active']
    * @param {Object | null} goal - optional goal which should be set as active
    * @param {Object | null} options - optional information e.g. if goal not provided, options.goalId can tell us goal to set as active
    */
    $rootScope.setActiveGoal = function(goal, options){

      if (!goal){
        if (options.goalId){

          for (var i = 0; i < $rootScope.data.goal.length; i++) {
            if ($rootScope.data.goal[i]._id === options.goalId){

              $rootScope.data.goal['active'] = $rootScope.data.goal[i];
            }
          };
        }
      } else {

        $rootScope.data.goal['active'] = goal;
      }

      // if still no active goal is set then the either the goal doesn't exist or its private
      if (!('active' in $rootScope.data.goal)){
        $location.path('/404');
        return null;
      }

      // clear active actions
      $rootScope.data.goal['active'].action = []; 
      // one goal has subsets of actions
      for (var i = 0; i < $rootScope.data.action.length; i++) {

        if ($rootScope.data.action[i]._goalid == $rootScope.data.goal['active']._id){
          $rootScope.data.goal['active'].action.push($rootScope.data.action[i]);
        }
      };
    }

    /**
    * Sets active action i.e. sets the property action['active']
    * @param {Object | null} action - optional action which should be set as active
    * @param {Object | null} goal - optional goal to be appended to active action
    * @param {Object | null} options - optional information e.g. if goal not provided, options.goalId can tell us goal to set as active
    */
    $rootScope.setActiveAction = function(action, goal, options){
      // find action if not provided
      if (!action){
        if (options.actionId){

          for (var i = 0; i < $rootScope.data.action.length; i++) {
            if ($rootScope.data.action[i]._id === options.actionId){

              $rootScope.data.action['active'] = $rootScope.data.action[i];
            }
          };
        }
      } else {

        $rootScope.data.action['active'] = action;
      }

      // if still no active action is set then the either the goal doesn't exist or its private
      if (!('active' in $rootScope.data.action)){
        $location.path('/404');
        return null;
      }

      $rootScope.data.action['active'].goal = [];
      if (!goal){
        for (var i = 0; i < $rootScope.data.goal.length; i++) {

          if ($rootScope.data.goal[i]._id == $rootScope.data.action['active']._goalid){
            $rootScope.data.action['active'].goal.push($rootScope.data.goal[i]);
            break;
          }
        };
      } else {
        $rootScope.data.action['active'].goal = goal;
      }
      
    }

    /**
    * Logs user out, resets memory data to defaults ($rootScope variables), and redirects user to login page
    */
    $rootScope.logout = function(){
      $rootScope.user = {};
      $rootScope.message = 'Logged out.';
      $rootScope.data = [];
      $rootScope.data.outlook = 7;
      $rootScope.data.user = {};
      $rootScope.data.user._id = '';
      $rootScope.data.loggedInAs = {_id: '', first_name: '', picture_url: ''};

      // clear localStorage user
      localStorage.removeItem('loggedInAs');

      $http.post('/logout');
    };

    /**
    * Toggles the state of menu between visible and hidden
    * @param {String} id - the id of the menu to toggle
    */
    $rootScope.toggleMenu = function(id) {
      $mdSidenav(id).toggle();
    };

  /**
   * Persistant check if user logged in
   */
    $rootScope.isLoggedIn = function (){
      if ($rootScope.data.loggedInAs._id !== ''){
        return true;
      } else {
        return false;
      }
    };

  /**
   * Check if the same user who is logged in is looking at their own profile or someone else's
   */
    $rootScope.sameUser = function (){
      var isLoggedIn = $rootScope.isLoggedIn();

      if ($rootScope.isLoggedIn = false){ return false;}

      if ($rootScope.data.user._id === $rootScope.data.loggedInAs._id){
        return true;
      } else {
        return false;
      }
    }

    /**
    * Removes action from data.action and data.action['active']
    * Required after deleting an action
    * @param {String} actionId - Id of action to be removed
    */
    $rootScope.removeAction = function (actionId){

      if ($rootScope.data.action['active']){
        if ($rootScope.data.action['active']._id === actionId){
          delete $rootScope.data.action['active'];
        }
      }

      for (var i = 0; i < $rootScope.data.action.length; i++) {
        if ($rootScope.data.action[i]._id === actionId){
          // remove 1 action at ith position
          $rootScope.data.action.splice(i,1);
          break;
        }
      };
    }

    /**
    * Removes goal from data.goal and data.goal['active']
    * Required after deleting a goal
    * @param {String} goalId - Id of goal to be removed
    */
    $rootScope.removeGoal = function (goalId){

      if ($rootScope.data.goal['active']){
        if ($rootScope.data.goal['active']._id === goalId){
          delete $rootScope.data.goal['active'];
        }
      }

      for (var i = 0; i < $rootScope.data.goal.length; i++) {
        if ($rootScope.data.goal[i]._id === goalId){
          // remove 1 action at ith position
          $rootScope.data.goal.splice(i,1);
          break;
        }
      };
    }

    $rootScope.runLoaded = true;
  });

 /** CONTROLLERS */

 /**
 * Login Controller
 * @constructor
 */
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
      var url = '/' + user._id + '/dashboard';
      $rootScope.message = 'Authentication successful!';
      $rootScope.data.loggedInAs._id = user._id;
      $rootScope.data.loggedInAs.first_name = user.first_name;
      $rootScope.data.loggedInAs.picture_url = user.picture_url;

      // save user to localstorage in case rootscope is wiped, e.g. page refresh
      var lsUser = JSON.stringify({_id: user._id, first_name: user.first_name, picture_url: user.picture_url});
      localStorage.setItem('loggedInAs', lsUser);

      $location.url(url);
      // $scope.loadData();
      $rootScope.busy = false;

    })
    .error(function(){
      // Error: authentication failed
      $rootScope.message = 'Authentication failed.';
      $scope.loginStatus = "Invalid details";

      // clear ls user if exists
      var lsUser = localStorage.getItem('loggedInAs');
      if (lsUser){
        localStorage.removeItem('loggedInAs');
      }

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
    $http.get('/auth/google', {
    })
    .success(function(user){
      // No error: authentication OK
    })
    .error(function(){
      // Error: authentication failed
      $rootScope.message = 'Authentication failed.';
      $location.url('/login');
      $rootScope.busy = false;
    });
  };

  $scope.resetPassword = function(){
    var body = {recipient: $scope.user.username};
    DataService.resetPassword(body)
      .success(function(res){
        console.log('resetPassword success:' + res);
        // Todo: provide confirmation to user of successful password reset
      })
      .error(function(err){
        console.log('resetPassword failed: ' + err);
      });
  }
});

/**
 * Dashboard Controller
 * @constructor
 */
app.controller('DashboardCtrl', function(DataService, $scope, $http, $mdSidenav, $timeout, $rootScope) {

  console.log('DASHBOARDCTRL');

  $scope.$watch('data.outlook', function() {
    if ($rootScope.data.goal){
      DataService.updateOutlook($rootScope.data.goal, $rootScope.data.action, $rootScope.data.outlook);
    }
  });

  $scope.incrementProgress = function(action){
    DataService.postProgress($rootScope.data.action, action, 1, $rootScope.data.outlook);
  };

  $scope.completeGoal = function(goal){
    var body = {status: "Closed - Complete", }
    // DataService.setOutlook(outlook);
    DataService.putGoal(goal, body);
  };

  $scope.update = function(){
    console.log('update')
    DataService.updateOutlook($rootScope.data.goal, $rootScope.data.action, $rootScope.data.outlook);
  }
});

app.controller('CreateActionCtrl', function(DataService, $scope, $http, $mdSidenav, $timeout, $rootScope, $routeParams) {

  console.log('CREATE ACTION CTRL');

  // Check if active goal set (or did user go direct to goal)
  $scope.goalLoaded = false;

  $rootScope.$watch('data.goal', function(){
    if ($rootScope.data.goal){

      if (!$scope.goalLoaded){
        // only set active goal once data.goal is available
        var options = {goalId: $routeParams.goalId};
        $rootScope.setActiveGoal(null, options);
        $scope.goalLoaded = true;
        $scope.methods.resetInput();
      } 
    }
  });

  $scope.toggleMenu = function toggleMenu(){
    $rootScope.toggleMenu('create-action');
  }

  $scope.saveActionAPI = function saveActionAPI(adjustedAction){

      // save api
      DataService.saveAction(adjustedAction)
        .success(function(action){
          $rootScope.data.goal['active'].action.push(action);
          $rootScope.data.action.push(action);
          $scope.methods.resetInput();

          DataService.updateOutlook($rootScope.data.goal, $rootScope.data.action, $rootScope.data.outlook);
          DataService.updateOutlook($rootScope.data.goal['active'], $rootScope.data.goal['active'].action, $rootScope.data.outlook);

        })
        .error(function(err){
          console.log('could not create action:');
          console.log(err);
        });
  }

  $scope.data = {
    action: {}
  }

  $scope.methods = {
    resetInput: function resetInput(){
      $scope.data.action = {goalId: $rootScope.data.goal['active']._id, goalDescription: $rootScope.data.goal['active'].description, is_public: true, statusOn: true, verb: '', verb_quantity: '', noun: '', period: ''};
    },
    toggleMenu: function toggleMenu(){
      $scope.toggleMenu();
    },
    saveAction: function saveAction(){

      var goalId        = $rootScope.data.goal['active']._id;
      var verb          = $scope.data.action.verb;
      var verb_quantity = $scope.data.action.verb_quantity;
      var noun          = $scope.data.action.noun;
      var period        = $scope.data.action.period;
      var is_public     = $scope.data.action.is_public;
      var statusOn      = $scope.data.action.statusOn;

      // var action = {_goalid: goalId, verb: verb, verb_quantity: verb_quantity, noun: noun, period: period, is_public: is_public, statusOn: statusOn};

      // action to push to rootscope
      var summary = [];
      var now = new Date(Date.now());
      var status = [{date: now, on: statusOn}];
      var adjustedAction = {_goalid: goalId, verb: verb, verb_quantity: verb_quantity, noun: noun, period: period, is_public: is_public, summary: summary, date_created: now, date_modified: now, statusOn: statusOn, status: status};

      // validation
      if (!goalId || goalId == '' || !verb || verb == '' || !verb_quantity || verb_quantity == '' || !noun || noun == '' || !period || period == '') {
        console.log('saveAction validation error');
        return null;
      }

      $scope.saveActionAPI(adjustedAction);

    } 
    // end of saveAction
  }
});

app.controller('ProfileCtrl', function(DataService, $scope, $http, $mdSidenav, $timeout, $rootScope) {

  console.log('profile page');

  $scope.updateIsPublic = function(){

    var body = {'is_public': $rootScope.data.user.is_public};

    DataService.updateProfile(body)
      .success(function(res){
        console.log('updated profile successfully')
      })
      .error(function(err){
        console.log('Could not update profile')
      });
  }

  $scope.updatePictureUrl = function(){

    var body = {'picture_url': $rootScope.data.user.picture_url};

    DataService.updateProfile(body)
      .success(function(res){
        console.log('updated profile successfully')
      })
      .error(function(err){
        console.log('Could not update profile')
      });
  }

  $rootScope.busy = false;

});


/**
* Goal Controller
* @constructor
*/
app.controller('GoalCtrl', function(DataService, $scope, $http, $mdSidenav, $timeout, $rootScope, $routeParams) {

  console.log('GOALCTRL');

  /** goalId from url: /:userId/goal/:goalId */
  $scope.goalId = $routeParams.goalId;
  $scope.showEditButtons = false;
  $scope.activeGoalSet = false;
  $scope.preEditGoal = {};

  /**
   * If user hits page direct/refreshes, data is loaded after GoalCtrl is run (data.goal is empty).
   * This functions waits until data.goal is set to go on to set active goal
   * @param {string} data.goal - The array of goals for user.
   */
  $scope.$watch('data.goal', function() {
    console.log('DATA.GOAL CHANGE');

    if ($rootScope.data.goal){

      console.log('DATA AVAILABLE');
      if (!$scope.activeGoalSet){
        $scope.setActiveGoal();
      }
    }
  });

  /**
   * Sets active goal to be picked up in view.
   * To save on looping through goals and actions, active goal may be set directly from dashboard or list.
   * This function must therefore handle both cases; active goal already being set and active goal not being set e.g. user opens a link to goal
   */
  $scope.setActiveGoal = function(){
    if (!('active' in $rootScope.data.goal) || ($rootScope.data.goal['active']._id != $scope.goalId)) {

      for (var i = 0; i < $rootScope.data.goal.length; i++) {

        if ($rootScope.data.goal[i]._id == $scope.goalId) {
          $rootScope.data.goal['active'] = $rootScope.data.goal[i];
          break;
        };
      };
      // if no goal found, redirect
      if (!$rootScope.data.goal){
        $location.path('/404');
      }
    }
    $rootScope.data.goal['active'].action = [];
    // find all associated actions
    for (var i = 0; i < $rootScope.data.action.length; i++) {

      if ($rootScope.data.action[i]._goalid === $scope.goalId){
        $rootScope.data.goal['active'].action.push($rootScope.data.action[i]);
      }
    };
    // create a copy to go back to preEdit values
    $scope.preEditGoal = Object.assign({}, $rootScope.data.goal['active']);
    // calculate action totals
    DataService.updateOutlook($rootScope.data.goal['active'], $rootScope.data.goal['active'].action, $rootScope.data.outlook);  
    $scope.activeGoalSet = true;
  }

  /**
   * Watch outlook for any changes. If all necessary data has been loaded then recalculate totals upon outlook change
   * @param {integer} data.outlook - global outlook
   */
  $scope.$watch('data.outlook', function() {
    if ($scope.activeGoalSet){
      DataService.updateOutlook($rootScope.data.goal['active'], $rootScope.data.goal['active'].action, $rootScope.data.outlook);
    }
  });

  $scope.save = function(){
    console.log('save');
    // put api
    var goals = [];
    $rootScope.data.goal['active'].date_modified = new Date(Date.now());
    goals.push($rootScope.data.goal['active']);

    DataService.putGoal($rootScope.data.goal['active'])
      .success(function(res){
        console.log('putgoal success: ' + res);
        DataService.prepareGoalData(goals, $rootScope.data.outlook);

        // set preEditGoal as new updated goal
        $scope.preEditGoal = Object.assign({}, $rootScope.data.goal['active']);
        $scope.showEditButtons = false;
      })
      .error(function(err){
        console.log('putgoal error: ' + err);
      });
  };

  $scope.cancel = function(){

      $rootScope.data.goal['active'].description   = $scope.preEditGoal.description;
      $rootScope.data.goal['active'].due           = new Date($scope.preEditGoal.due);
      $rootScope.data.goal['active'].status        = $scope.preEditGoal.status;
      $rootScope.data.goal['active'].is_public     = $scope.preEditGoal.is_public;
      $rootScope.data.goal['active'].date_created  = new Date($scope.preEditGoal.date_created);
      $rootScope.data.goal['active'].date_modified = new Date($scope.preEditGoal.date_modified);
      $scope.showEditButtons = false;
  };

  $scope.goalDataChanged = function(){
    $scope.showEditButtons = true;
  };

  /**
   * Adds a single progress point onto action
   * @param {object} action - The action to be incremented
   */
  $scope.incrementProgress = function(action){
    DataService.postProgress($rootScope.data.goal['active'].action, action, 1, $rootScope.data.outlook);
  };

  $rootScope.busy = false;
});

/**
 * Action Controller - used in conjunction with the action view.
 * @constructor
 * @param {factory} DataService - The service for CRUD ops against dataset
 */
app.controller('ActionCtrl', function(DataService, $scope, $http, $mdSidenav, $rootScope, $routeParams) {

  $scope.activeActionSet = false;
  $scope.preEdit = {};
  $scope.actionId = $routeParams.actionId;

  /**
   * Sets active goal to be picked up in view.
   * To save on looping through goals and actions, active goal may be set directly from dashboard or list.
   * This function must therefore handle both cases; active goal already being set and active goal not being set e.g. user opens a link to goal
   */
  $scope.setActiveAction = function(){
    // Active property not set e.g. user clicks on direct link to action page
    if (!('active' in $rootScope.data.action) || ($rootScope.data.action['active']._id != $scope.actionId)) {
      // Set active property based on actionId from routeparams
      for (var i = 0; i < $rootScope.data.action.length; i++) {
        if ($rootScope.data.action[i]._id == $scope.actionId) {
          $rootScope.data.action['active'] = $rootScope.data.action[i];
          break;
        };
      };
      // if no action found, redirect
      if (!$rootScope.data.action){
        $location.path('/404');
      }
    }
    // append parent goal to active action
    $rootScope.data.action['active'].goal = [];
    // find associated parent goal
    for (var i = 0; i < $rootScope.data.goal.length; i++) {

      if ($rootScope.data.goal[i]._id === $rootScope.data.action['active']._goalid){
        $rootScope.data.action['active'].goal.push($rootScope.data.goal[i]);
      }
    };
    // create a copy to go back to preEdit values
    $scope.preEdit = {is_public: $rootScope.data.action['active'].is_public,
                      on: $rootScope.data.action['active'].status[$rootScope.data.action['active'].status.length-1].on,
                      _goalid: $rootScope.data.action['active']._goalid
    };

    // calculate action totals
    DataService.updateOutlook(null, $rootScope.data.action['active'], $rootScope.data.outlook);  
    $scope.activeActionSet = true;
  }

  $scope.incrementProgress = function(){
      DataService.postProgress($rootScope.data.action['active'], $rootScope.data.action['active'], 1, $rootScope.data.outlook);
    };

  $scope.decrementProgress = function(action){
      DataService.postProgress($rootScope.data.action['active'], $rootScope.data.action['active'], -1, $rootScope.data.outlook);
    };

  $scope.actionDataChanged = function(){
    $scope.showEditButtons = true;
  }

  $scope.cancel = function(){

        $rootScope.data.action['active'].is_public = $scope.preEdit.is_public;
        $rootScope.data.action['active'].status[$rootScope.data.action['active'].status.length-1].on = $scope.preEdit.on;
        $rootScope.data.action['active']._goalid = $scope.preEdit._goalid;

        $scope.showEditButtons = false;
  }

  $scope.save = function(){
    console.log('save');
    // put api
    $rootScope.data.action['active'].date_modified = new Date(Date.now());

    var actionUpdate = {_goalid: $rootScope.data.action['active']._goalid, _id: $rootScope.data.action['active']._id, is_public: $rootScope.data.action['active'].is_public, status: $rootScope.data.action['active'].status};
    DataService.putAction(actionUpdate)
      .success(function(res){
        console.log('putAction success: ' + res);
        DataService.prepareActionData($rootScope.data.action['active'], $rootScope.data.outlook);
        // set preEdit as new updated goal
        $scope.preEdit = {is_public: $rootScope.data.action['active'].is_public,
                           on: $rootScope.data.action['active'].status[$rootScope.data.action['active'].status.length-1].on,
                           _goalid: $rootScope.data.action['active']._goalid
                         }
        $scope.showEditButtons = false;
      })
      .error(function(err){
        console.log('putAction error: ' + err);
      });
  }

  /**
   * Watch outlook for any changes. If all necessary data has been loaded then recalculate totals upon outlook change
   * @param {integer} data.outlook - global outlook
   */
  $scope.$watch('data.outlook', function() {
      if ($scope.activeActionSet){
        DataService.updateOutlook(null, $rootScope.data.action['active'], $rootScope.data.outlook);
      }
    });

  /**
   * If user hits page direct/refreshes, data is loaded after ActionCtrl is run (data.action is empty).
   * This functions waits until data.goal is set to go on to set active goal
   * @param {string} data.action - The array of actions.
   */
  $scope.$watch('data.action', function() {
    console.log('DATA.ACTION CHANGE');

    if ($rootScope.data.action){

      console.log('DATA AVAILABLE');
      if (!$scope.activeActionSet){
        $scope.setActiveAction();
      }
    }
  });

  $rootScope.busy = false;
});

/**
* Signup Controller
* @constructor
*/
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
          $location.path('/login');
          console.log('angular: registered user successfully');
        }, function errorCallback(response) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          $scope.signupNotification = response.data;
          console.log(response.data);
        });
  }
});

/**
* Root Controller
* @constructor
*/  
app.controller('RootCtrl', ['$scope', '$rootScope', '$location', '$mdSidenav', function($scope, $rootScope, $location, $mdSidenav) {

  $scope.toggleMenu = function(id) {
    $mdSidenav(id).toggle();
  };

  $scope.pagename = function() { return $location.path(); };
}]);

/**
* List Controller
* @constructor
*/  
app.controller('ListCtrl',['DataService', '$scope', '$rootScope', function(DataService, $scope, $rootScope) {

  console.log('LIST CTRL');

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

  $scope.scopeSet = false;

  $scope.incrementProgress = function(action){
    DataService.postProgress($rootScope.data.action, action, 1, $rootScope.data.outlook);
  };

  $scope.completeGoal = function(goal){
    var body = {status: "Closed - Complete", }
    // DataService.setOutlook(outlook);
    DataService.putGoal(goal, body);
  };

  console.log('END LIST CTRL');

  $rootScope.busy = false;
}]);

/**
* Create Controller - used for directive
* @constructor
*/  
app.controller('CreateCtrl', ['$scope', 'DataService', '$mdSidenav', '$rootScope', '$location', function($scope, DataService, $mdSidenav, $rootScope, $location){

  $scope.methods = {
    // called on action tab click to load goals
    initialise: function(){
      console.log('initialising...');
      $scope.data.goals = $rootScope.data.goal;
      console.log($scope.data.goals);
    },
    resetScopeData: function(){

        var goalId = 0;
        var actionid = '';
        var goalSelected = 0;
        var selectedIndex = 0;
        var goalDescription = '';
        var deleteView = {};
        
        // Setup variables to be able to distinguish between different pages
        var url = $location.url();
        var page = url.split('/')[2]; // assuming a url route of /:userid/goal
        var title = '';

        if (page==='goal' || page === 'action'){
          var pageId = url.split('/')[3];
          title = 'Create / Delete';
        } else {
          title = 'Create';
        }

        // Todo: what if user goes directly to page / refreshes page - set active goal/action first
        if (page === "goal") {
        $scope.data.deleteView = {};
         selectedIndex = 1;

          if ('active' in $rootScope.data.goal){
          } else {
            var options = {goalId: pageId};
            $rootScope.setActiveGoal(null, options);
          }
            goalId = $rootScope.data.goal['active']._id;
            deleteView.goalId = $rootScope.data.goal['active']._id;
            deleteView.description  = $rootScope.data.goal['active'].description;
            deleteView.actionDestination = 'move';
            deleteView.actionMoveTo = '';
            deleteView.untitled = [{_id: '', description: 'Untitled'}];
        }
        else if (page === "action"){
         selectedIndex = 1;

         if ('active' in $rootScope.data.action){
          } else {
            var options = {actionId: pageId};
            $rootScope.setActiveAction(null, options);
          }
          actionid = $rootScope.data.action['active']._id;
          deleteView.actionId = $rootScope.data.action['active']._id;
          deleteView.description = $rootScope.data.action['active'].verb + ' ' + $rootScope.data.action['active'].verb_quantity + ' every ' + $rootScope.data.action['active'].period + ' days' ;

        }

        $scope.data = {
          view: {
            selectedIndex: selectedIndex,
            page: page,
            title: title
          },
          goal: {
            statusList: $rootScope.statusList,
            description: '',
            is_public: true,
            status: 'Open',
            deleteView: deleteView
          },
          action: {
            goalSelected: goalId,
            _goalid     : goalId,
            is_public   : true,
            verb        : '',
            verb_quantity : 1,
            noun        : '',
            period      : 7,
            statusOn     : true,// [{date: '2016-01-01', on: true}, {date: '2016-02-01', on: false}]
            deleteView: deleteView
          }
        }

        // Todo: remove current goal
        $scope.data.goals = $rootScope.data.goal;
        $scope.scopeSet = true;
        
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

          $rootScope.data.goal.push(res);
          DataService.updateOutlook($rootScope.data.goal, $rootScope.data.action, $rootScope.data.outlook);
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
          $rootScope.data.action.push(res);
          $scope.methods.resetScopeData();

          // activeGoal indicates whether the user created the action from its respective goal page
          if ($rootScope.data.goal['active']._id == goalid) {
            $rootScope.data.goal['active'].action.push(res);
            // $rootScope.setActiveAction(res, null);

            DataService.updateOutlook($rootScope.data.goal['active'], $rootScope.data.goal['active'].action, $rootScope.data.outlook);
          };

          DataService.updateOutlook(null, $rootScope.data.action, $rootScope.data.outlook);
        })
        .error(function(err){
          console.log('could not create action:');
          console.log(err);
        });
    },
    deleteGoal: function deleteGoal(){
      console.log('delete goal');
      // @param {String} actionDestination - may either be 'move' (move all actions to another goal), or 'delete' (delete all associated actions)
      var options = {actionDestination: $scope.data.goal.deleteView.actionDestination, actionMoveTo: $scope.data.goal.deleteView.actionMoveTo};
      DataService.deleteGoal($rootScope.data.goal['active'], options)
        .success(function(res){

          var goalId = $rootScope.data.goal['active']._id;
          $rootScope.removeGoal(goalId);

          // remove actions
          if (options.actionDestination === 'delete'){

            for (var i = $rootScope.data.action.length - 1; i >= 0; i--) {
              if ($rootScope.data.action[i]._goalid === goalId){
                  $rootScope.data.action.splice(i,1);
              }
            };
          }
          // update existing actions
          else if (options.actionDestination === 'move'){
            for (var i = $rootScope.data.action.length - 1; i >= 0; i--) {
              if ($rootScope.data.action[i]._goalid === goalId){
                  $rootScope.data.action._goalid = options.actionMoveTo;
              }
            };
          }
          // redirect to dashboard
          DataService.updateOutlook($rootScope.data.goal, $rootScope.data.action, $rootScope.data.outlook);
          $location.path('/' + $rootScope.data.loggedInAs._id + '/dashboard');
        })
        .error(function(err){
          console.log('error deleting goal');
        })
    },
    deleteAction: function deleteAction(){
      console.log('delete action');
      DataService.deleteAction($rootScope.data.action['active'])
        .success(function (res){
          console.log('action deleted successfully');
            // remove all references of action from data.action 
            $rootScope.removeAction($rootScope.data.action['active']._id);
            DataService.updateOutlook($rootScope.data.goal, $rootScope.data.action, $rootScope.data.outlook);
            $location.path('/' + $rootScope.data.loggedInAs._id + '/dashboard');
        })
        .error(function (err){
          console.log('action was not deleted');
        })
    }
  }

  /**
  * Wait until data is available (goal and action) before resetting scope data
  */
  $scope.$watch('data.goal', function (){
    if ($rootScope.data.goal && $rootScope.data.action){
      if (!$scope.scopeSet){
        $scope.methods.resetScopeData();
      }
    }
  });
}]);


/** FACTORIES AND SERVICES */

/**
* DataService Factory - responsible for exposing API endpoints and modelling data
* @constructor
*/
app.factory("DataService", ['$rootScope', '$http', '$filter', function($rootScope, $http, $filter) {

  var dataSet = [];
  //functions defined within a JSON object so they're accessible to eachother
  var functions = {
    loggedIn: function(callbackTrue, callbackFalse, callbackError){
      $http.get('/loggedin')
        .success(function(user){
          console.log('LOGGEDIN NO ERROR');
          // Authenticated
          if (user !== '0'){
            callbackTrue(user, $rootScope);
          }
          // Not Authenticated
          else {
            callbackFalse();
          }
        })
        .error(function(err){
          callbackError();
        });
    },
    updateProfile: function(body){
      return $http.put('/api/v1/me', body);
    },
    loadPrivateData: function(){
      return $http.get('/api/v1/privateData');
    },
    loadPublicData: function(userId){
      return $http.get('/api/v1/publicData/' + userId);
    },
    resetPassword: function(email){
      return $http.post('/api/v1/resetPassword', email);
    },
    deleteAction: function(action){
      return $http.delete('/api/v1/action/' + action._id);
    },
    /**
    * Requests node deletes given goal and optionally its associated actions
    * Since Angular doesn't support sending req.body in delete requests, I've used a put request instead
    * @param {Object} goal - Goal object to extract id from
    * @param {Object} options - Indicates whether associated actions should also be deleted or rehomed
    */
    deleteGoal: function(goal, options){
      return $http.put('/api/v1/deleteGoal/' + goal._id, options);
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
    /*
    * Sends xhr request to post a new progress item. Used when incrementing/decrementing progress
    * @param {Array} actions
    * @param {Object} action
    * @param {Number} progress - the quantity by which to add to progress
    * @param {Number} outlook
    */
    postProgress: function(actions, action, progress, outlook){
    $rootScope.busy = true;

    var body = {_actionid: action._id, counter: progress}
    body.date_modified = new Date(Date.now());

    $http.post('/api/v1/progress', body)
      .success(function (res){
        console.log('Updated progress successfully: ' + JSON.stringify(res));
        console.log(action);
        action.currentProgress += progress;
        action.chart.data[0].values[action.currentPeriod-1].y += progress;
        action.date_modified = body.date_modified; // necessary?

        // attempt at bug fix: progress not updating after creating/updating new action
        if (action.summary.length === 0){
          action.summary = [{progress: 0, period: 1}];
        }

        var currentPeriodFound = false;
        //increment action scope
        for (var j = action.summary.length - 1; j >= 0; j--) {
          if (action.summary[j].period == action.currentPeriod) {
            action.summary[j].progress += progress;
            console.log('INCREMENTED ACTION PROGRESS : ' + action.verb);
            currentPeriodFound = true;
            break;
          };
        };

        // Push current slice of summary if period doesn't exist
        if (!currentPeriodFound){
          var period = action.currentPeriod;
          var newSummary = {period: period, progress: progress}
          action.summary.push(newSummary);
        }

        functions.prepareActionData(actions, outlook);

        // User may have only changed subset of actions e.g. by incrementing an action in goal view
        // Check to see if we also need to recalculate action totals for entire dataset 
        if (actions.length !== $rootScope.data.action.length){
          functions.prepareActionData($rootScope.data.action, outlook);
        }

        $rootScope.busy = false;
      })
      .error(function(error){
        console.log('ProgressFactory error: ' + JSON.stringify(error));
        $rootScope.busy = false;
      });
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

        var singleAction = false;
        var tempActions = [];
        // if single action is provided instead of an array, calculate and append totals to itself.
        // This is useful for active action.
        if (!Array.isArray(actions)){
          singleAction = true;
          tempActions.push(actions);
          actions = [];
          actions.push(tempActions[0]);
        }

        for (var i=0; i < actions.length; i++){
          
          var action = actions[i];

          //set date objects from strings
          action.date_modified = new Date(action.date_modified);
          action.date_created = new Date(action.date_created);
          action.due = new Date(action.due);

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
          action.chart.xAxisLabel = 'Number of ' + $filter('periodInWords')(action.period, 1) + ' since ' + $filter('date')(action.date_created, "dd MMM, yyyy");
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
                          height: 160,
                          margin : {
                              top: 10,
                              right: 20,
                              bottom: 50,
                              left: 50
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
          // console.log('actionDurOn: ' + actionDurOn);

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

        // Decide where to append totals to. Against the single action, or a set of actions
        if (singleAction){

          actions[0].total = {};
          actions[0].total.total = total;
          actions[0].total.on = on;
          actions[0].total.off = off;
          actions[0].total.repetition = repetition;
          actions[0].total.rep_complete = rep_complete;
          actions[0].total.rep_conversion = rep_conversion;
        } else {

          actions.total = {};
          actions.total.total = total;
          actions.total.on = on;
          actions.total.off = off;
          actions.total.repetition = repetition;
          actions.total.rep_complete = rep_complete;
          actions.total.rep_conversion = rep_conversion;

        }

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

    /*
    * Calculates the amount of days the given action has had a status of 'on' within a date range
    * @param {Object} action - action object
    * @param {Object} dateRange - Object containing date items {start, end}
    * @returns {Number} - number of days action had 'on' status
    */
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

    /*
    * Recalculates totals for goals and actions given an outlook period
    * @param {Array | null} goals - the set of goals to be recalculated
    * @param {Array | null} actions - the set of actions to be recalculated
    * @param {Number} outlook - the period to recalculate goals and actions
    * @returns {Object} dataSet - the set of updated goals and actions. Not used as goal/action data prepared by ref.
    */
    updateOutlook: function(goals, actions, outlook){

      // can use null to not prepareGoalData
      if (goals && outlook){
        functions.prepareGoalData(goals, outlook);
      }

      if (actions && outlook) {
        functions.prepareActionData(actions, outlook);
      };

      $rootScope.busy = false;

      var dataSet = {goals: goals, actions: actions, outlook: outlook};
      // console.log('dataSet:');
      // console.log(dataSet);
      return dataSet;
    },

    /*
    * Calculates the number of days between two dates
    * @param {String | Date | null} startDate 
    * @param {String | Date | null} endDate 
    * @return {Number} daysDiff
    */
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
    }
}
return functions;
}]);


/** FILTERS */

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

app.filter('plural', function(){
  return function(number){
    return (number == 1) ? '' : 's';
  }
});

app.filter('firstNChars', function(){
  // returns first n chars of string, appends ... to strings surpassing length limit
  return function(string, limit){
    var output = string;
    if (string.length > limit){
      output = string.substring(0, limit - 3) + '...';
    }
    return output;
  }
})

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

/** DIRECTIVES */

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

app.directive('createAction', function() {
  return {
    restrict: 'E',
    scope: {
      f: '=f',  // functions or methods
      d: '=d'   // data
    },
    templateUrl: 'views/create-action.html'
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