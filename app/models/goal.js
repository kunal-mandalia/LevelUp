var mongoose = require('mongoose');

var goalSchema = mongoose.Schema({
    _userid				: String, // Use Object Id instead? Is underscore prefix ok to indicate foreign key?
	description			: String,
	date_start			: Date, //
	date_closed			: Date, //
    due					: Date,
    status				: { type: String, default: "Open"}, // {Open, Closed - goal achieved, Closed - goal not achieved},
    is_public			: { type: Boolean, default: false},
    date_created		: { type: Date, default: Date.now },
    date_modified		: { type: Date, default: Date.now }
});

// create the model for goal and expose it to our app
module.exports = mongoose.model('Goal', goalSchema);
