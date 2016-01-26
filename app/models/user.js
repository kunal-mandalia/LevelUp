var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
	email 				: { type: String, unique: true },
	password			: String,
	first_name 			: String, 
	last_name		 	: String,
	public				: Boolean
});

userSchema
.virtual('fullname')
.get(function () {
	return this.firstname + ' ' + this.lastname;
});

// create the model for user and expose it to our app
module.exports = mongoose.model('User', userSchema);