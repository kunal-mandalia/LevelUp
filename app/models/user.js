var mongoose = require('mongoose');

var userSchema = mongoose.Schema({

	email 				: { type: String, unique: true },
	password			: String,
	firstname 			: String, 
	lastname		 	: String
});

userSchema
.virtual('fullname')
.get(function () {
	return this.firstname + ' ' + this.lastname;
});


// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);