var mongoose = require('mongoose');

var actionSchema = mongoose.Schema({
	_goalid			: String, // Use objectId instead?
    public			: Boolean,
    verb 			: String,
    verb_quantity	: Number,
    verb_unit 		: String,
    noun			: String,
    period 			: String,
    expire 			: Date
});

// create the model for goal and expose it to our app
module.exports = mongoose.model('Action', actionSchema);


