#Dashboard KPI calculations

Suppose Outlook = Last 7 days

Goals
	Open
	- Sum of goals with status = open

	Closed
	- Sum of goals with status = closed, modified in last 7 days

	Completed
	- Sum of goals with status = closed - completed, modified in last 7 days

Actions
	Open
	- Sum of actions with status = open

	? New
	- created in last 7 days

	Closed
	- Sum of actions with status = closed, modified in last 7 days

	Completed
	- Sum of actions with status = closed - complete, modified in last 7 days

	Repetitions
	- Sum for each action (a.verb_quantity/a.period)*outlook

	Reps completed
	- Sum for each action (Sum progress in a.summary)

	Rep conversion
	- (reps completed/repetitions)*100 %

##Angular data model:

Create a service which can be used by Dashboard, Tracking, etc.

$scope.data = [];
$scope.data.goal = [];
$scope.data.goal.total = {open: 0, closed: 0, completed: 0};

$scope.data.action = [];
$scope.data.action.total = {open: 0, closed: 0, complete: 0, repetition: 0, rep_complete: 0, rep_conversion: 0};

$scope.data.outlook = 0;

// functions to calculate totals

$scope.function = [];
$scope.function.action = [];

$scope.function.action.totals = function(outlook){
	
	var open, closed, complete = 0;
	var repetition, rep_complete, rep_conversion = 0;
	var temp_rep_total, temp_rep_complete = 0;
	var outlookDate = new Date(Date.now() - (outlook * 86400000));

	for (var i=0; data.action.length -1; i++){
		
		var action = data.action[i];
		var action.date_modified = new Date(action.date_modified);

		// calculate open, closed, complete
		if (action.status == 'Open'){
			open += 1;	
		}
		else if ((action.status == 'Closed - complete') && (outlookDate < action.date_modified)){
			closed += 1;
		}
		else if ((action.status == 'Closed - incomplete') && (outlookDate < action.date_modified)){
			complete += 1;
		}

		// calculate repetition, rep_complete, both at the individual action level and running total
		// having these stats at the individual action level means they're available for when user drills down into the action detail view.

		for (var j=0; j < data.action[i].summary.length - 1; j++){
			temp_rep_complete += data.action[i].summary[j].progress;
		}

		data.action[i].summary.totalProgress = temp_rep_complete;
		rep_complete += temp_rep_complete;

		data.action[i].summary.totalRepetition += Math.ceil((action.verb_quantity/action.period)*outlook*100); // since action.period is per day, we can multiply by outlook to get expected total reps over day range

		repetition += data.action[i].summary.totalRepetition;

		// clear temp vars
		temp_rep_total = 0;
		temp_rep_complete = 0;
	}

	// calculate rep_conversion
	rep_conversion = (rep_complete/repetition)*100;

	$scope.data.action.total.open = open;
	$scope.data.action.total.closed = closed;
	$scope.data.action.total.complete = complete;
	$scope.data.action.total.repetition = repetition;
	$scope.data.action.total.rep_complete = rep_complete;
	$scope.data.action.total.rep_conversion = rep_conversion;
}

$scope.function.goal.totals = function(outlook){
	
	var open, closed, complete = 0;
	var outlookDate = new Date(Date.now() - (outlook * 86400000));

	for (var i=0; data.goal.length -1; i++){
		
		var goal = data.goal[i];
		var goal.date_modified = new Date(goal.date_modified);

		// calculate open, closed, complete
		if (goal.status == 'Open'){
			open += 1;	
		}
		else if ((goal.status == 'Closed - complete') && (outlookDate < goal.date_modified)){
			closed += 1;
		}
		else if ((goal.status == 'Closed - incomplete') && (outlookDate < goal.date_modified)){
			complete += 1;
		}
	}

	$scope.data.goal.total.open = open;
	$scope.data.goal.total.closed = closed;
	$scope.data.goal.total.complete = complete;
}


// run functions on outlook change

$scope.$watch('data.outlook', function() {

	$scope.function.goal.totals(data.outlook);
	$scope.function.action.totals(data.outlook);

});

//// convert to service

app.factory("AnalyticService", function() {

// get data

var data = [];
var data.goal = [{ "_id" : ObjectId("56b5175586a734929f840b37"), "_userid" : "56adf77a12493f2e694857fe", "description" : "Swim with the sharks", "due" : ISODate("2016-02-18T00:00:00Z"), "date_modified" : ISODate("2016-02-05T21:42:45.358Z"), "date_created" : ISODate("2016-02-05T21:42:45.358Z"), "__v" : 0 },
{ "_id" : ObjectId("56b52db7d975b5e2a02fff11"), "_userid" : "56adf77a12493f2e694857fe", "description" : "Become an internet entrepreneur", "due" : ISODate("2019-04-30T23:00:00Z"), "date_modified" : ISODate("2016-02-05T23:18:15.052Z"), "date_created" : ISODate("2016-02-05T23:18:15.052Z"), "__v" : 0, "status" : "Open", "is_public" : false },
{ "_id" : ObjectId("56b632e3a334ca1aa8455c3f"), "_userid" : "56adf77a12493f2e694857fe", "description" : "Wrestle a Bengal tiger", "due" : ISODate("2015-02-28T00:00:00Z"), "date_modified" : ISODate("2016-02-06T17:52:35.693Z"), "date_created" : ISODate("2016-02-06T17:52:35.692Z"), "is_public" : true, "status" : "Closed - Complete", "__v" : 0 }];
var data.goal.total = {open: 0, closed: 0, completed: 0};

var data.action = [{ "_id" : ObjectId("56b52b40d5de4bcfa06731ca"), "_goalid" : "56b4d18452a04e329db914cc", "verb" : "Write", "verb_quantity" : 2, "noun" : "letters to the dolphins", "period" : 7, "due" : ISODate("2018-01-02T00:00:00Z"), "date_created" : ISODate("2016-02-05T23:07:44.546Z"), "summary" : [ { "period" : 1, "progress" : 1 } ], "__v" : 3, "date_modified" : ISODate("2016-02-06T19:09:41.022Z"), "status" : "Closed - Complete", "is_public" : false },
{ "_id" : ObjectId("56b52b9ad5de4bcfa06731ce"), "_goalid" : "56b4faf430de908d9f2d9b40", "verb" : "Monkey", "verb_quantity" : 4, "noun" : "letters to the dolphins", "period" : 1, "due" : ISODate("2018-01-02T00:00:00Z"), "date_created" : ISODate("2016-01-01T00:00:00Z"), "summary" : [ { "period" : 1, "progress" : 1 }, { "period" : 39, "progress" : 3 }, { "period" : 40, "progress" : 2 }, { "period" : 41, "progress" : 4 }, { "period" : 42, "progress" : 2 }, { "period" : 43, "progress" : 1 } ], "__v" : 37, "date_modified" : ISODate("2016-02-07T11:41:58.085Z"), "status" : "Open", "is_public" : false }];

var data.action.total = {open: 0, closed: 0, complete: 0, repetition: 0, rep_complete: 0, rep_conversion: 0};

var data.outlook = 0;

return {
	actionTotals: function(){
			var open, closed, complete = 0;
			var outlook = data.outlook;
			var repetition, rep_complete, rep_conversion = 0;
			var temp_rep_total, temp_rep_complete = 0;
			var outlookDate = new Date(Date.now() - (outlook * 86400000));

			for (var i=0; data.action.length -1; i++){
				
				var action = data.action[i];
				var action.date_modified = new Date(action.date_modified);

				// calculate open, closed, complete
				if (action.status == 'Open'){
					open += 1;	
				}
				else if ((action.status == 'Closed - complete') && (outlookDate < action.date_modified)){
					closed += 1;
				}
				else if ((action.status == 'Closed - incomplete') && (outlookDate < action.date_modified)){
					complete += 1;
				}

				// calculate repetition, rep_complete, both at the individual action level and running total
				// having these stats at the individual action level means they're available for when user drills down into the action detail view.

				for (var j=0; j < data.action[i].summary.length - 1; j++){
					temp_rep_complete += data.action[i].summary[j].progress;
				}

				data.action[i].summary.totalProgress = temp_rep_complete;
				rep_complete += temp_rep_complete;

				data.action[i].summary.totalRepetition += Math.ceil((action.verb_quantity/action.period)*outlook*100); // since action.period is per day, we can multiply by outlook to get expected total reps over day range

				repetition += data.action[i].summary.totalRepetition;

				// clear temp vars
				temp_rep_total = 0;
				temp_rep_complete = 0;
			}

			// calculate rep_conversion
			rep_conversion = (rep_complete/repetition)*100;

			data.action.total.open = open;
			data.action.total.closed = closed;
			data.action.total.complete = complete;
			data.action.total.repetition = repetition;
			data.action.total.rep_complete = rep_complete;
			data.action.total.rep_conversion = rep_conversion;
	},
	goalTotals: function(){
		var open, closed, complete = 0;
		var outlook = data.outlook;
		var outlookDate = new Date(Date.now() - (outlook * 86400000));

		for (var i=0; data.goal.length -1; i++){
			
			var goal = data.goal[i];
			var goal.date_modified = new Date(goal.date_modified);

			// calculate open, closed, complete
			if (goal.status == 'Open'){
				open += 1;	
			}
			else if ((goal.status == 'Closed - complete') && (outlookDate < goal.date_modified)){
				closed += 1;
			}
			else if ((goal.status == 'Closed - incomplete') && (outlookDate < goal.date_modified)){
				complete += 1;
			}
		}
		data.goal.total.open = open;
		data.goal.total.closed = closed;
		data.goal.total.complete = complete;
	},
	setOutlook: function(outlook){
		data.outlook = outlook;
	},
	getData: function(){
		return data;
	}
}