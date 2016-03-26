var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
	email 				: { type: String, unique: true },
	password			: String,
	first_name 			: String, 
	last_name		 	: String,
	is_public			: { type: Boolean, default: false },
	picture_url			: String, 
	date_created		: { type: Date, default: Date.now },
    date_modified		: { type: Date, default: Date.now }
});

userSchema.virtual('fullname').get(function () {
	return this.firstname + ' ' + this.lastname;
});

userSchema.methods.changePassword = function(newPasswordHash, cb){
	this.password = newPasswordHash;
	this.save(function (err) {
	    cb(err, this);
	  });
}

// create the model for user and expose it to our app
module.exports = mongoose.model('User', userSchema);