var express = require('express');
var http = require('http');
var path = require('path');
var routes = require('./app/routes.js');
var mongoose  = require('mongoose');
var request = require('request');
var auth = require('./app/models/auth.js');
var env = require('./config/environmentVariables.js');
var User = require('./app/models/user.js');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var GithubStrategy = require('passport-github').Strategy;
var passportConfig = require('./config/passportConfig.js');

mongoose.connect(env.db);
//==================================================================
// Define the strategy to be used by PassportJS
passport.use(new LocalStrategy(
  function(username, password, done) {

    //1. check user's email exists
    //2. check if a hased version of the password provided matches the password hash saved on mongo
    User.findOne({email:username}, function(err,user){
        if (err) { return done(err); }
        if (!user) { return done(null, false); }

        var passwordMatches = bcrypt.compareSync(password, user.password);
        //console.log('passwordMatches: ' + passwordMatches);
        if (!passwordMatches) { return done(null, false); }
        return done(null, user);
    });
  }
));

// Google strategy
passport.use(new GoogleStrategy({
    clientID: passportConfig["Google"].clientID,
    clientSecret: passportConfig["Google"].clientSecret,
    callbackURL: passportConfig["Google"].callbackURL
  },
  function(accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
    // done has been extended, the function takes three parameters; err, user, info
    // if no user exists in db, then redirect user to signup page with prefilled fields using profile
    // we'll put this redirecturl in 'info'
    process.nextTick(function () {

      User.findOne({email:profile.emails[0].value}, function(err,user){

        if (err) {
         console.log('google oauth error: ' + err);
         return done(err);
        }

        if (!user) { 
          //prepare newuser data and redirect to signup page as user doesn't exist
          var firstName = profile.name.givenName;
          var lastName = profile.name.familyName;
          var email = profile.emails[0].value;
          var signuplink = '/#/signup?firstName=' + firstName + '&lastName=' + lastName + '&email=' + email;

          return done(null, false, signuplink); 
        }
        // if (!user.verifyPassword(password)) { return done(null, false); }
        console.log('google user found : ' + profile.emails[0].value);
        return done(null, user, null);
      });
    });
  }
));

// Github strategy
passport.use(new GithubStrategy({
    clientID: passportConfig["Github"].clientID,
    clientSecret: passportConfig["Github"].clientSecret,
    callbackURL: passportConfig["Github"].callbackURL,
    profileFields: ['email']
  },
  function(accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
    // done has been extended, the function takes three parameters; err, user, info
    // if no user exists in db, then redirect user to signup page with prefilled fields using profile
    // we'll put this redirecturl in 'info'
    console.log(JSON.stringify(profile));

    process.nextTick(function () {

    //
    var options = {
      headers: {
        'User-Agent': 'MEANT',
        'Authorization': 'token ' + accessToken
      },
      json:    true,
      url:     'https://api.github.com/user/emails'
    };

    // get emails using oauth token
    request(options, function(error, response, body) {
      if (error || response.statusCode != 200) {
        req.log.error(error, body);
        done(null, false, {message: "Error communicating with github."});
        return;
      }

//      [ { email: 'iliakan@gmail.com', primary: true, verified: true } ],

      var emails = body.filter(function(email) {
        return email.verified;
      });

      if (!emails.length) {
        return done(null, false, {message: "No emails associated with this Github account"});
      }

      profile.emails = [
        {value: emails[0].email }
      ];

      User.findOne({email:profile.emails[0].value}, function(err,user){

        if (err) {
         console.log('github oauth error: ' + err);
         return done(err);
        }

        if (!user) { 
          //prepare newuser data and redirect to signup page as user doesn't exist
          var firstName = profile.displayName;
          var lastName = '';
          var email = profile.emails[0].value;
          var signuplink = '/#/signup?firstName=' + firstName + '&lastName=' + lastName + '&email=' + email;

          return done(null, false, signuplink); 
        }
        // if (!user.verifyPassword(password)) { return done(null, false); }
        console.log('github user found : ' + profile.emails[0].value);
        return done(null, user, null);
      });


    });
      //
      // 
    });
  }
));

// Serialized and deserialized methods when got from session
passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

// Start express application
var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.cookieParser()); 
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.session({ secret: 'securedsession' }));
app.use(passport.initialize()); // Add passport initialization
app.use(passport.session());    // Add passport initialization
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

//load routes
routes(app, User, bcrypt);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
