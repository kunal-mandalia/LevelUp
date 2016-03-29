LevelUp

Single source:
$rootScope.data.goal
$rootScope.data.action
$rootScope.data.progress
$rootScope.data.outlook

$rootScope.data.goal['active'] = $rootScope.data.goal[m]
$rootScope.data.action['active'] = $rootScope.data.goal[n]

Github issue #11

Steps to recreate issue of progress chart not updating:
1. login
2. from Dashboard, click on an action
3. Increment progress on that action

1. login
2. from Dashboard, click on a goal
3. Click an action
4. Increment progress on that action

Not reproducible on newer goals/actions - closing

Github issue: Make website restful #10

Urls:
	/dashboard - no change
	/list - no change
	/goal -> /goal/:id
	/action -> /action/:id

Data:
	$rootScope.data.goal = [{goal1}, ... , {goalN}]
	$rootScope.data.goal["active"] = null || $rootScope.data.goal[i]
	$rootScope.data.action = [{action1}, ... , {actionN}]
	$rootScope.data.action["active"] = null || $rootScope.data.goal[j]

	Instead of having $rootScope.data.activeGoal = [], $rootScope.data.activeAction = []

Impact:
	Areas of the app likely to be impacted include:
	1. goalCtrl: change reference from activeGoal.goal to goal["active"], 
	2. actionCtrl: change reference from activeAction to action["active"]

	When the user hits /goal/:id check if active goal set, if not find goal e.g.

	if goal["active"] == null || goal["active"]._id != urlParam._id{
		// loop through rootScope goals and match _id to urlParam._id
	}

	Clear goal["active"] on /dashboard, /list
	
Entry points:
	loadData on: /goal/:id, /action/:id, /dashboard, /list
	Don't loadData on: /login, /signup, /

	Require an intermediate function to check if data is loaded, similar to check login

Current flow for Goal page:
	1. ng-click="setActiveGoal(g)" href="#/goal"
	1.1.	
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
	    }

	   incrementProgress -> 
	   	$rootScope.data.action // calculate action total, 
	   	$rootScope.data.action[k].chart
	   	$rootScope.data.action[k].summary[j]
	   	$rootScope.data.action[k].totalProgress
	   	$rootScope.data.action[k].totalRepetition

	   	recalculateActionStats(action)
	   		- chart, summary, totalProgress
	   	
---------------
	   	prepareActionData: function(actions, outlook){

        for (var i=0; i < actions.length; i++){
          
          var action = actions[i];

          // handle case where no current period progress
          // only calculate currentProgress if it's not already been calculated
          // the user may have incremented currentProgress so we don't want to lose this value
          // whenever updateScope is called (which in turn calls this function)
          if (!action.currentProgress){

          	//// Todo: function required: calculateProgressTotals(action)
          	////		calculates: 
          	//// 			actions.total.total = total;
	        ////			actions.total.on = on;
	        ////			actions.total.off = off;
	        ////			actions.total.repetition = repetition;
	        ////			actions.total.rep_complete = rep_complete;
	        ////			actions.total.rep_conversion = rep_conversion;

	        ////			action.chart.data[0].values
	        ////			actions[i].total.repetition
	        ////			actions[i].total.rep_complete
	        ////			actions[i].total.rep_conversion

            for (var j = action.summary.length - 1; j >= 0; j--) {
              if (action.summary[j].period == action.currentPeriod) {
                currentProgress = action.summary[j].progress;
                break;
              };
            };
            action.currentProgress = currentProgress;
          }

          // TODO: Only updated action needs data value updated
          for (var j = 0; j < totalPeriodsIncludingCurrent; j++) {
            var value = {x: j+1, y: 0};
            action.chart.data[0].values.push(value);
          };

          for (var j = 0; j < action.summary.length; j++) {
            var period = action.summary[j].period;
            action.chart.data[0].values[period-1].y = action.summary[j].progress;
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
    }


Iss5: Create public profile view #5
	This dovetails with iss10: restful design

	Options:
		1.	A dedicated route for public profiles
			/public/:userEmail/dashboard
			/public/:userEmail/list
			/public/:userEmail/goal/:goalId
			/public/:userEmail/action/:actionId

		2.	The same URL for loggedin/public profiles (how linkedin do it)
		/:userEmail/dashboard

		/:userEmail/goal/:goalId

			loggedin -> no, checkPublic (new API) -> yes?, return data.
			getPublicData(userEmail) (instead of loadData2, loadPublicData)

		/:userEmail/dashboard

		data.user -> getUserInfo


Rethinking the restful routes (issues having /:id/profile, /:id/dashboard)

Menu bars depending on loggedin, anon - NOW {OK: [anon, loggin/own, loggedin/other]} - done
List view - aria labels, loading screen - done
github callback url - done
Profile page logout, - done
dashboard - buttons, aria-labels - done
goal aria-labels - done
comment code according to JSdoc standard - inprog/done


auth api routes // TODO: check action belongs to current user - client and server? Do both...Must be on server at least
Secure these API endpoints:

	updateProfile: function(body){
      return $http.put('/api/v1/me', body); done
    },
    loadPrivateData: function(){
      return $http.get('/api/v1/privateData'); not required
    },
    loadPublicData: function(userId){
      return $http.get('/api/v1/publicData/' + userId); not required
    },
    resetPassword: function(email){
      return $http.post('/api/v1/resetPassword', email); not required
    },
    deleteAction: function(action){
      return $http.delete('/api/v1/action/' + action._id); done
    },
    deleteGoal: function(goal, options){
      return $http.put('/api/v1/deleteGoal/' + goal._id, options); done - tested with postman
    },
    putAction: function(action){
      return $http.put('/api/v1/action/' + action._id, action); done
    },
    putGoal: function(goal){
      return $http.put('/api/v1/goal/' + goal._id, goal); done
    },
    saveGoal: function(goal){
      return $http.post('/api/v1/goal', goal); not needed
    },
    saveAction: function(action){
      return $http.post('/api/v1/action', action); not needed
    },
test public/private views - done
hide/disable controls if not logged in and current - after auth api - done

Menu profile image css cross browser - done
favicon: - done

Todo: action.put status (handle like action post is handled) - hard - handle server side
bug: putgoal error: undefined saving goal reopen
18,28->17,24