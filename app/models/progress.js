var mongoose = require('mongoose');

var progressSchema = mongoose.Schema({
    _actionid		: String,
    counter			: Number,
    comment 		: String, 
    date_created	: { type: Date, default: Date.now },
    date_modified	: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Progress', progressSchema);

/*
	Let the client handle rendering data - e.g. grouping into periods
	The user's historical actions will be the source, just expose it through an API
	
	Let the user retrospectively go back through the history and make changes
	to allow for progress to be logged not in realtime
*/