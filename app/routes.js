var auth = require('./models/auth.js');
var passport = require('passport');

module.exports = function(app, User, bcrypt) {

	app.get('/', function(req, res){
	  res.render(__dirname + '/views/index.ejs', { title: 'Express' });
	});

	app.get('/users', auth, function(req, res){
	  res.send([{name: "user1"}, {name: "user2"}]);
	});

	//api to be called from angular
	app.get('/api/me', auth, function(req, res){
		res.send(req.user.email);
	});
	//==================================================================

	//==================================================================
	// route to test if the user is logged in or not
	app.get('/loggedin', function(req, res) {
	  res.send(req.isAuthenticated() ? req.user : '0');
	});

	// route to log in
	app.post('/login', passport.authenticate('local'), function(req, res) {
	  res.send(req.user);
	});

	// route to log out
	app.post('/logout', function(req, res){
	  req.logOut();
	  res.send(200);
	});
	//==================================================================

	app.get('/auth/google',
	  passport.authenticate('google', { scope: 'https://www.googleapis.com/auth/userinfo.email'}));

	// auth function extended to allow another parameter, signup, to be accessed
	// so unregistered users can be redirected and signup and be prefilled with profile info
	// http://passportjs.org/docs/authenticate
	app.get('/auth/google/callback', function(req, res, next) {
	  passport.authenticate('google', function(err, user, signup) {
	    if (err) { return next(err); }
	    if (!user) { return res.redirect(signup); }
	    req.logIn(user, function(err) {
	      if (err) { return next(err); }
	      return res.redirect('/#/dashboard');
	    });
	  })(req, res, next);
	});


	app.get('/auth/github',
	  passport.authenticate('github', { scope: 'user'}));

	app.get('/auth/github/callback', function(req, res, next) {
	  passport.authenticate('github', function(err, user, signup) {
	    if (err) { return next(err); }
	    if (!user) { return res.redirect(signup); }
	    req.logIn(user, function(err) {
	      if (err) { return next(err); }
	      return res.redirect('/#/dashboard');
	    });
	  })(req, res, next);
	});

	app.post('/registerUser', function(req, res){
		// 1. validate all fields are present 2. validate passwords match
		if (!req.body.firstName || !req.body.lastName || !req.body.email || !req.body.password1 || !req.body.password2 || (req.body.password1 !== req.body.password2)){
			console.log('bad request');
			
			res.status(400);
			res.send('Try again');

		} 
		else
		{
			//3. check if user exists
			User.findOne({email:req.body.email}, function(err, user){
				if(err){
					res.status(400);
					res.send('Server error');
				}else{
					if(user){
						res.status(400);
						res.send('User already exists');
					}else{
						//4. create user: hash password
						bcrypt.hash(req.body.password1, 8, function(err, hash) {
							if (err){
								res.status(400);
								res.send('Server error');
							}
							else {
								
								var newUser = new User({ firstName: req.body.firstName, lastName: req.body.lastName, email: req.body.email, password: hash });
								newUser.save(function (err, user) {
								  if (err) {
								  	res.status(400);
									res.send('Server error');
								  }
								  else{
								  	req.logIn(user, function (err) {
						                if(err){
						                    res.status(400);
											res.send('Server error');
						                }else{
						                	res.status(200);
						                	res.end(); //redirect clientside
						                    //return res.redirect('/#/dashboard');
						                }
						            });
								  }
								});
							}
						});
					}
				}
			});
		}
	});
};