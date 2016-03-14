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

	Clear goal["active"] on /dashboard, /list,
	
Entry points:
	loadData on: /goal/:id, /action/:id, /dashboard, /list
	Don't loadData on: /login, /signup, /
