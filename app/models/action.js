var mongoose = require('mongoose');

var actionSchema = mongoose.Schema({
	_goalid			: String,
    public			: Boolean,
    verb 			: String,
    verb_quantity	: Number,
    noun			: String,
    period 			: String,
    due 			: Date,
    date_created    : { type: Date, default: Date.now },
    date_modified   : { type: Date, default: Date.now }
});

// create the model for goal and expose it to our app
module.exports = mongoose.model('Action', actionSchema);


