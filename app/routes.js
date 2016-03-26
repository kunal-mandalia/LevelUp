var auth = require('./models/auth.js');
// var passport = require('passport');

module.exports = function(passport, app, User, Goal, Action, Progress, bcrypt) {

	app.get('/', function(req, res){
	  res.render(__dirname + '/views/index.ejs', { title: 'Express' });
	});

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
	  passport.authenticate('google', { scope: 'email profile'}));

	// auth function extended to allow another parameter, signup, to be accessed
	// so unregistered users can be redirected and signup and be prefilled with profile info
	// http://passportjs.org/docs/authenticate
	app.get('/auth/google/callback', function(req, res, next) {
	  passport.authenticate('google', function(err, user, signup) {
	    if (err) { return next(err); }
	    if (!user) { return res.redirect(signup); }
	    req.logIn(user, function(err) {
	      if (err) { return next(err); }
	      return res.redirect('/#/' + user._id + '/dashboard?loginSource=google&first_name=' + user.first_name + '&picture_url=' + encodeURI(user.picture_url));
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
	      return res.redirect('/#/' + user._id + '/dashboard?loginSource=github&first_name=' + user.first_name + '&picture_url=' + encodeURI(user.picture_url));
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
								
								var newUser = new User({ first_name: req.body.firstName, last_name: req.body.lastName, email: req.body.email, password: hash, public: false  });
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
						                    //return res.redirect('/#/tracking');
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
		User.findOne({email: req.user.email}, function(error, user){
			if(error){res.send(400);};

			var userDetails = Object.assign({}, user);
			delete userDetails._doc["password"];
			// console.log('userDetails');
			// console.log(user);
			// console.log(userDetails);
			res.send(userDetails._doc);
		});
	});

	// update user
	app.put('/api/v1/me', auth, function(req, res){

		console.log(req.body);

		// sanitise attempted password change
		var safeBody = req.body;
		if ((typeof(safeBody)==="object") && (!safeBody['password'])){
			delete safeBody['password'];
		}

		User.update({email: req.user.email}, { $set: safeBody }, function(err, user){
			if(err){res.send(400);};
			return res.send('Updated user');
		});

	});

	// GOALS API
	app.get('/api/v1/goal', auth, function(req, res){
		// Goal.find({ _userid: req.user._id }, function(err, goal){
		// 	if (err){return res.send(err);}

		// 	return res.send(goal);
		// });
		Goal.find()
		  .where('_userid')
		  .in(['56a6a3dc99d9ad855233e990', '56aa4bad352af28e579e34cb'])
		  .exec(function (err, goal) {
		    //make magic happen
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
		// TODO: Handle goal passed in instead of broken down namespaced req.body...
		//get currently logged in user id through req.user._id
		var goal = new Goal({ _userid: req.user._id, description: req.body.description, due: req.body.due, status: req.body.status, is_public: req.body.is_public });
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

	/**
	* Deletes a goal and depending on the options, its associated actions or rehouses associated actions (giving them a particular id)
	* @param {String} req.params.id - goalid
	* @param {String} req.body.actionDestination - the destination of associated actions; either 'move' to another goal or 'delete'
	*/
	app.delete('/api/v1/goal/:id', auth, function(req, res){

		var actionDestination = req.body.actionDestination;
		var actionMoveTo 	  = req.body.actionMoveTo;
		//1. delete goal. only authorized user may delete goal
		Goal.findOneAndRemove({ _userid: req.user._id, _id: req.params.id}, function(err){
			if (err){ return res.send(err);}

			//2. Remove or rehouse associated actions
			Action.find({_goalid: req.params.id}, function(err, docs){
				if (err){ return res.send(err);}

				if  (actionDestination === 'move'){

				}
				else if (actionDestination === 'delete'){

				}

			})
			return res.send('Removed goal');
		});
	});

	// ACTIONS API
	app.post('/api/v1/action', auth, function(req, res){

		// 	   _goalid			: String, // Use objectId instead?
		//     public			: Boolean,
		//     verb 			: String,
		//     verb_quantity	: Number,
		//     verb_unit 		: String,
		//     noun				: String,
		//     period 			: String,
		//     expire 			: Date
		var now = new Date(Date.now());
		// 1. find goal (to attach action to) and ensure it belongs to current user
		Goal.findOne({_userid: req.user._id, _id: req.body._goalid}, function(err, goal){
			if (err){return res.send(err);}

			// check if goal returned
			if (!goal){

				const error = new Error('Goal does not exist');
				return res.send(error);
			}

			// goal found and it belongs to current user

			// var testDate = new Date('2016-02-11');

			var action = new Action({ 
			    _goalid			: req.body._goalid,
			    is_public		: req.body.is_public,
			    verb 			: req.body.verb,
			    verb_quantity	: req.body.verb_quantity,
			    verb_unit 		: req.body.verb_unit,
			    noun			: req.body.noun,
			    period 			: req.body.period,
			    // date_created 	: req.body.date_created,
			    // date_modified	: req.body.date_modified,
			    status			: [{date: now, on: req.body.statusOn}]
			});

			action.save(function (err, createdAction) {
			  if (err){
			  	res.status(400);
			  	res.send('Server error');
			  }
			  return res.send(JSON.stringify(createdAction));
			});
		});
	});

	

	app.put('/api/v1/action/:id', auth, function(req, res){
		// Todo: check if Action belongs to current user
		// Todo: handle status update
		Action.update({ _id: req.params.id}, { $set: req.body }, function(err, rawResponse){
			if (err){ return res.send(err);}

			return res.send('Updated action : ' + JSON.stringify(rawResponse) + JSON.stringify(req.body));
		});
	});

	app.get('/api/v1/action/:id', auth, function(req, res){
		Action.findOne({_id: req.params.id}, function(err, doc){
			if (err){ return res.send(err);}

			return res.send(JSON.stringify(doc));
		})
	});
	// Todo: ensure action belongs to logged in user
	app.delete('/api/v1/action/:id', auth, function(req, res){
		Action.findOneAndRemove({ _id: req.params.id}, function(err){
			if (err){ return res.send(err);}

			return res.send('Document removed');
		});
	});

	// PROGRESS API
	app.post('/api/v1/progress', auth, function(req, res){
		// 1. find action (to attach progress to) [TODO: and ensure it belongs to current user]
		Action.findOne({_id: req.body._actionid}, function(err, action){
			if (err){
				var error = new Error('Something went wrong');
				return res.send(error);
			}

			// check if goal returned
			if (!action){

				var error = new Error('Action does not exist');
				return res.send(error);
			}

			// action found
			// TODO: check action belongs to current user


			console.log( JSON.stringify(action));

			var nowString = req.body.date_created || Date.now();
			var now = new Date(nowString);
			var progressCount = req.body.counter;

			var progress = new Progress({ 
			    _actionid		: req.body._actionid,
			    counter			: req.body.counter,
			    comment			: req.body.comment,
			    date_created    : req.body.date_created
			});

			progress.save(function (err, createdProgress) {
			  if (err){
			  	res.status(400);
			  	res.send('Server error');
			  }

			  //req.body is out of scope, setup local variables
			    console.log (action.updateSummary(now, progressCount));

			  return res.send(JSON.stringify(createdProgress));
			});
		});
	});

	

	app.post('/api/v1/resetPassword', function(req, res){
		var recipient = req.body.recipient;
		// var username;
		// var password;

		// 1. check if user exists
		User.findOne({email: recipient}, function(err, doc){
			if (err){return res.send('error finding user');}
			if (!doc){return res.send('No such email found');}
			else {
			// 2. create random password, from SO

			    var text = "";
			    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

			    for( var i=0; i < 5; i++ ){
			        text += possible.charAt(Math.floor(Math.random() * possible.length));
			    }

			    bcrypt.hash(text, 8, function(err, hash) {
					if (err){
						res.status(400);
						res.send('Server error');
					}
					else {

						doc.changePassword(hash, function(err,doc){
							if (!err){
								// 3. send email to user with plain text password
								var sendgrid  = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);
								sendgrid.send({
								  to:       recipient,
								  from:     'no-reply@levelup.kunalmandalia.com',
								  fromname: 'LevelUp',
								  subject:  'Password reset',
								  text:     'Your new password is: ' + text + '. Go to levelup.kunalmandalia.com to continue'
								}, function(err, json) {
								  if (err) { return res.send(err); }
								  else {return res.send('Reset Okay!');}
								  console.log(json);
								});
							}
						}); 
					}
				});
			}
		});
	});



	/**
	 * Gets logged in user's data
	 * @return [Array] [goals, actions, progress, user]
	 */
	app.get('/api/v1/privateData', auth, function(req, res){

		var user = {};
		var goals = [];
		var actions = [];
		var progress = [];

		var goalIds = [];
		var actionIds = [];

		var goalsActionsProgress = [];

		user.first_name 	= req.user.first_name;
		user.last_name  	= req.user.last_name;
		user.date_created  	= req.user.date_created;
		user.date_modified  = req.user.date_modified;
		user.is_public  	= req.user.is_public;
		user.email  		= req.user.email;
		user.picture_url    = req.user.picture_url;
		user._id 			= req.user._id;
		// 1. find all goals for current user
		Goal.find()
		  .where('_userid').equals(req.user._id)
		  .exec(function (err, goalDocs) {
		    //make magic happen
	    	if (err){return res.send(err);}

			goals = goalDocs;
			// 2. get actions for all goals
			for (var i = 0; i < goals.length; i++) {
				goalIds[i] = goals[i].id;
			};

			Action.find()
				.where('_goalid')
				.in(goalIds)
				.exec(function (err, actionDocs){

					if (err){return res.send(err);}

					actions = actionDocs;
					// goalsActions = [goals, actions];
					// return res.send(goalsActions);

					// 3. get actions for all goals
					for (var i = 0; i < actions.length; i++) {
						actionIds[i] = actions[i].id;
					};

					Progress.find()
					.where('_actionid')
					.in(actionIds)
					.sort({date_created: 'descending'})
					.exec(function (err, progressDocs){

						if (err){return res.send(err);}

						progress = progressDocs;
						goalsActionsProgress = [goals, actions, progress, user];
						return res.send(goalsActionsProgress);
					});

				});
		  });
	});

// 
// 	Public API
// 
	app.get('/api/v1/publicData/:userId', function(req, res){
		// res.send('public data returned ' + req.params.userId);

		var user = {};
		var goals = [];
		var actions = [];
		var progress = [];

		var goalIds = [];
		var actionIds = [];

		var data = [];

		// 0. check if public profile exists

		User.find({_id: req.params.userId, is_public: true})
		  .exec(function (err, userDoc){


		  	console.log('userDoc');
		  	console.log(userDoc);


		  	if (err) {return res.send(err);}
		  	else if (!userDoc || userDoc.length===0) {
		  		res.status(404);
	      		return res.send('not found');
		  	}
		  	else {
		  		user.first_name 	= userDoc[0].first_name;
				user.last_name  	= userDoc[0].last_name;
				user.date_created  	= userDoc[0].date_created;
				user.date_modified  = userDoc[0].date_modified;
				user.is_public  	= userDoc[0].is_public;
				user._id  			= req.params.userId;
				user.picture_url    = userDoc[0].picture_url;
		  	
				// 1. find all public goals for current user
				Goal.find({_userid: req.params.userId, is_public: true})
				  .exec(function (err, goalDocs) {
				    //make magic happen
			    	if (err){return res.send(err);}

					goals = goalDocs;
					// 2. get actions for all goals
					for (var i = 0; i < goals.length; i++) {
						goalIds[i] = goals[i].id;
					};

					Action.find({is_public: true})
						.where('_goalid')
						.in(goalIds)
						.exec(function (err, actionDocs){

							if (err){return res.send(err);}

							actions = actionDocs;
							// goalsActions = [goals, actions];
							// return res.send(goalsActions);

							// 3. get actions for all goals
							for (var i = 0; i < actions.length; i++) {
								actionIds[i] = actions[i].id;
							};

							// TODO: decide if progress logs are worth querying - currently not used
							Progress.find()
							.where('_actionid')
							.in(actionIds)
							.sort({date_created: 'descending'})
							.exec(function (err, progressDocs){

								if (err){return res.send(err);}

								progress = progressDocs;
								data = [goals, actions, progress, user];
								return res.send(data);
							});
						});
				  });
			}
		});
	});


	
};