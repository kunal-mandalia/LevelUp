var mongoose = require('mongoose');

var goalSchema = mongoose.Schema({
    _userid				: String, // Use Object Id instead? Is underscore prefix ok to indicate foreign key?
	description			: String,
    due					: Date,
    status				: String, // {Open, Closed - goal achieved, Closed - goal not achieved},
    public				: Boolean
});

// create the model for goal and expose it to our app
module.exports = mongoose.model('Goal', goalSchema);
