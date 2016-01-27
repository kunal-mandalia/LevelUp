var auth = require('./models/auth.js');
var passport = require('passport');

module.exports = function(app, User, Goal, bcrypt) {

	app.get('/', function(req, res){
	  res.render(__dirname + '/views/index.ejs', { title: 'Express' });
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
								
								var newUser = new User({ first_name: req.body.firstName, last_name: req.body.lastName, email: req.body.email, password: hash, public: false });
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

	//api to be called from angular
	app.get('/api/v1/me', auth, function(req, res){
		res.send(req.user.email);
	});

	// goals api
	app.get('/api/v1/goal', auth, function(req, res){
		Goal.find({ _userid: req.user._id }, function(err, goal){
			if (err){return res.send(err);}

			return res.send(goal);
		});
	});

	app.get('/api/v1/goal/:id', auth, function(req, res){
		//get currently logged in user id
		Goal.findOne({ _userid: req.user._id, _id: req.params.id}, function(err, goal){
			if (err){return res.send(err);}

			return res.send(JSON.stringify(goal));
		});
	});

	app.post('/api/v1/goal', auth, function(req, res){
		//get currently logged in user id through req.user._id
		var goal = new Goal({ _userid: req.user._id, description: req.body.description, due: req.body.due, status: req.body.status, public: req.body.public });
		goal.save(function (err, createdGoal) {
		  if (err){
		  	res.status(400);
		  	res.send('Server error');
		  }

		  return res.send(JSON.stringify(createdGoal));
		});
	});

	app.put('/api/v1/goal/:id', auth, function(req, res){
		// only update fields set in req.body
		Goal.update({ _userid: req.user._id, _id: req.params.id }, { $set: req.body }, function(err, rawResponse){
			if (err){ return res.send(err);}

			return res.send('Updated goal : ' + JSON.stringify(rawResponse));
		});
	});

	app.delete('/api/v1/goal/:id', auth, function(req, res){
		//only authorized user may delete goal
		Goal.findOneAndRemove({ _userid: req.user._id, _id: req.params.id}, function(err){
			if (err){ return res.send(err);}

			return res.send('Removed goal');
		});
	});

};