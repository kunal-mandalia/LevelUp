var mongoose = require('mongoose');

var actionSchema = mongoose.Schema({
	_goalid			: String,
    is_public		: { type: Boolean, default: false},
    verb 			: String,
    verb_quantity	: Number,
    noun			: String,
    period 			: Number, // TODO: Store period as Number, apply Angular filter clientside to show 'every month' for 30 days, 'every week' for 7 days, 'every 120 days' for 120 day custom period. 0: one time
    // due 			: Date, use status On/Off instead of hard due date
    summary			: [], // [{period: 1, progress: 2}, {period: 2, progress: 3}]. Similar to how Angular nvD3 requires data format
    status			: [], // [{date: '2016-01-01', on: true}, {date: '2016-02-01', on: false}]
    date_created    : { type: Date, default: Date.now }, // TODO: use start date instead of created
    date_modified   : { type: Date, default: Date.now },
    orphan			: { type: Boolean, default: false } //
});

actionSchema.methods.updateSummary = function(compareDate, progress, cb){

	var updatedSummary = this.summary;
	var progress = Number(progress);
	// 1. calculate current period
    var periodLengthMilliseconds = (this.period) * 86400000;
    var startDate = new Date(this.date_created);
    var startDateMilliseconds = startDate.getTime();
    var compareDateMilliseconds = compareDate.getTime();

    var totalPeriodsIncludingCurrent = Math.ceil((compareDateMilliseconds - startDateMilliseconds)/periodLengthMilliseconds);

	// 2. check if current period exists in summary array
	var periodIndex = -1; //-1 if doesn't exist, index number if period exists

	for (var i = this.summary.length - 1; i >= 0; i--) {
		if (this.summary[i].period == totalPeriodsIncludingCurrent) {
			periodIndex = i;
			break;
		};
	};
	// 	if it does, add the progress value, else create new json {period: x, progress: y} and append to summary
	if (periodIndex == -1){
		updatedSummary.push({"period": totalPeriodsIncludingCurrent, "progress": progress});
	}
	else{
		updatedSummary[periodIndex].progress = updatedSummary[periodIndex].progress + progress;
	}

	this.summary = updatedSummary;
	this.markModified('summary');

	this.save(function (err) {
	    if (err) return (err);
	    return this;
	  });
}

// actionSchema.methods.updateSummary = function(on, cb){
// 	var status = this.status;
// 	var now = new Date(Date.now());

// 	var summaryItem = {date: now, on: on};
// 	status.push(summaryItem);

// 	this.save(function (err) {
// 	    if (err) return handleError(err);
// 	    return this;
// 	  });
// }



// create the model for goal and expose it to our app
module.exports = mongoose.model('Action', actionSchema);


