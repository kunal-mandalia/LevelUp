var mongoose = require('mongoose');

var historySchema = mongoose.Schema({
    _actionid		: String
    progress		: Number,
    date_modified	: Date,
});

module.exports = mongoose.model('History', historySchema);

/*
	Let the client handle rendering data - e.g. grouping into periods
	The user's historical actions will be the source, just expose it through an API
	
	Let the user retrospectively go back through the history and make changes
	to allow for progress to be logged not in realtime
*/