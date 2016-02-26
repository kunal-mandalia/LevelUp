Redesigning Actions

Analysing performance based on actions:

function of Outlook (stats over time from now till Outlook days)


Scrap the following measurements:
- Open: total actions open for goal(s)
- Closed: total actions closed between now and outlook, requires date_closed
- Completed: total actions closed as Completed between now and outlook, requires date_closed

For a set of actions (these may be all actions across all goals or only those actions with a particular goalid)

Instead use:
- On: total actions with latest status On
- Off: total actions with latest status Off

- Repetitions: total target repetitions while action(s) were On: total duration On between Now and Outlook. 
- Repetitions complete: total progress between Now and Outlook.
- Repetition conversion rate: (100 * Repetitions / Repetitions complete) %

Implementation: separate out into individual functions, DataService.functions.actionDurationOn

action.status = [{date: "2016-01-01", on: true}, {date: "2016-02-01", on: false}];

actionDurationOn = function(action, start, end){
	var durationOn = 0;
	var lastStatus = action.status.length-1;
	var statusWithinRange = [];
	// TODO
	// case: (last ------- start ------ end) or (----start----end ---- first). Out of range
	if ((action.status[lastStatus].date < start) || ( end < action.status[0].date)) {
		return 0;
	};

	// case: some dates within range
	for (var i = 0; i < action.status.length; i++) {

		if ((action.status[i].date >= start) && (action.status[i].date <= end)){
			//
			statusWithinRange.push(action.status[i]);
		}
		else {
			break;
		};
	};

	//
	var lastDate = new Date();
	var nextDate = new Date();

	for (var i = 0; i < statusWithinRange.length; i++) {

		if (i == 0){ //
			lastDate = new Date(start);
			nextDate = new Date(statusWithinRange[0].date);

		}
		else if (i == statusWithinRange.length-1) { 
			lastDate = new Date(statusWithinRange[statusWithinRange.length-1].date);
			nextDate = new Date(end);
		}
		else {
			lastDate = new Date(statusWithinRange[i-1].date);
			nextDate = new Date(statusWithinRange[i].date);
		}

		durationOn += onDaysBetween(lastDate, nextDate, statusWithinRange[i].on);
	};

	return durationOn;
}

onDaysBetween = function(lastDate, nextDate, on){
	if (on == true){ return 0;} // the duration of this period has been off therefore return zero on days
	else {
		return (nextDate.getTime() - lastDate.getTime())/86400000; 
	}
}

test_actionDurationOn = function(){
	var action = [{description: "test-action"}];
	action.status = [{date: "2016-01-01", on: true}, {date: "2016-02-01", on: false}, {date: "2016-03-01", on: true}, {date: "2016-04-01", on: false}];

	// set date objects
	for (var i = 0; i < action.status.length; i++) {
		action.status[i].date = new Date(action.status[i].date);
	};

	var start = new Date('2016-01-15');
	var end = new Date('2016-03-15');

	var durationOn = actionDurationOn(action,start, end );
	console.log(durationOn);
}

actionRepetitions = function(action, start, end){
	var totalDuration = actionDurationOn(action, start, end); // days
	var repsPerDay = action.verb_quantity/actiom.period; // e.g. 15 per 30 = 0.5 per day
	var totalExpectedReps = Math.ceil(totalDuration * repsPerDay);
	return totalExpectedReps;
}

dateToPeriod = function(action, date){
	var durationDays = (date - action.date_created)/86400000; // TODO use const
	var period = Math.ceil(durationDays/action.period);
	return period;
}

periodToDate = function(action, period){
	var periodDateStart = new Date((action.date_created).getTime() + (action.period * (period -1) * 86400000)); // TODO use const
	var periodDateEnd = new Date((action.date_created).getTime() + (action.period * (period) * 86400000));

	return {start: periodDateStart, end: periodDateEnd};
}

actionRepetitionsComplete = function(action, start, end){
	var repetitionsComplete = 0;
	var periodStart = dateToPeriod(action, start); // e.g. 1
	var periodEnd = dateToPeriod(action, end); 	 // e.g. 4

	// Sum all progress of periods between periodStart and periodEnd e.g. progress[2] + progress[3]
	if (periodEnd - periodStart > 1){
		for (var i=periodStart; i < periodEnd; i++){

			// loop through summary and get progress for period
			for (var j=0; j < action.summary[j].length; j++){
				if (action.summary[j].period == i){
					repetitionsComplete += action.summary[j].progress;
					break;
				}
			}
		}
	}

	// proportionately sum progress of start and end periods e.g. (p1 * progress[1]) + (p2 * progress[2])
	// TODO

	return repetitionsComplete;
}

actionRepetitionConversion = function(complete, total){
	return Math.round(100 * complete/total);
}

actionTotals = function(actions){
	var totalOn = 0;
	var totalOff = 0;
	var total = actions.length;

	// loop through all actions, take last status - if "on" then increment
	for (var i=0; i < actions.length; i++){
		if (actions.status[actions.status.length-1].on == true){
			totalOn += 1;
		}
		else {
			totalOff += 1;
		}
	}
	return {totalOn: totalOn, totalOff: totalOff, total: total};
}