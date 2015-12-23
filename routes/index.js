var express = require('express');
var router = express.Router();
var mongoos = require('mongoose');
var User = require('../models/user');
var bCrypt = require('bcrypt-nodejs');

var nev = require('email-verification')(mongoos);
nev.configure({
    verificationURL: 'http://localhost:3000/email-verification/${URL}',
    persistentUserModel: User,
    tempUserCollection: 'coinava_tempusers',

    transportOptions: {
		host: 'gator2023.hostgator.com',
		port: 465,
		secure: true,
		auth: {
			user: 'dev@coinava.com',
			pass: 'As!12345'
		}
    },
    verifyMailOptions: {
        from: 'Do Not Reply <dev@coinava.com>',
        subject: 'Please confirm account',
        html: 'Click the following link to confirm your account:</p><p>${URL}</p>',
        text: 'Please confirm your account by clicking the following link: ${URL}'
    }
});
nev.generateTempUserModel(User);

var isAuthenticated = function (req, res, next) {
	// if user is authenticated in the session, call the next() to call the next request handler 
	// Passport adds this method to request object. A middleware is allowed to add properties to
	// request and response objects
	if (req.isAuthenticated())
		return next();
	// if the user is not authenticated then redirect him to the login page
	res.redirect('/');
}

module.exports = function (passport) {

	router.get('/str', function(req, res) {
		res.send('locale: ' + req.locale + '<br /> key app.name -> ' + req.i18n.t('app.name'));
	});

	/* GET login page. */
	router.get('/', function (req, res) {
		// Display the Login page with any flash message, if any
		res.render('index', { message: req.flash('message') });
	});

	/* Handle Login POST */
	router.post('/login', passport.authenticate('login', {
		successRedirect: '/home',
		failureRedirect: '/',
		failureFlash: true
	}));

	/* GET Registration Page */
	router.get('/signup', function (req, res) {
		res.render('register', { message: req.flash('message') });
	});

	/* Handle Registration POST */
	router.post('/signup', function (req, res) {
		var newUser = new User({
			email: req.body.email,
			firstName: req.body.firstName,
			lastName: req.body.lastName,
			password: bCrypt.hashSync(req.body.password),
			username: req.body.username
		});
		
		nev.createTempUser(newUser, function (err, newTempUser) {
			if (err) {
				return res.status(404).send('ERROR: creating temp user FAILED');
			}

			// new user created
			if (newTempUser) {
				var URL = newTempUser[nev.options.URLFieldName];

				nev.sendVerificationEmail(newTempUser.email, URL, function (err, info) {
					if (err) {
						return res.status(404).send('ERROR: sending verification email FAILED');
					}
					res.json({
						msg: 'An email has been sent to you. Please check it to verify your account.',
						info: info
					});
				});

				// user already exists in temporary collection!
			} else {
				res.json({
					msg: 'You have already signed up. Please check your email to verify your account.'
				});
			}
		});

		passport.authenticate('signup', {
			successRedirect: '/home',
			failureRedirect: '/signup',
			failureFlash: true
		});
	});

	/* GET Home Page */
	// router.get('/home', isAuthenticated, function (req, res) {
	router.get('/home', function (req, res) {
		res.render('home', { user: req.user });
	});

	/* Handle Logout */
	router.get('/signout', function (req, res) {
		req.logout();
		res.redirect('/');
	});

	// user accesses the link that is sent
	router.get('/email-verification/:URL', function(req, res) {
	var url = req.params.URL;
	
	nev.confirmTempUser(url, function(err, user) {
		if (user) {
		nev.sendConfirmationEmail(user.email, function(err, info) {
			if (err) {
				return res.status(404).send('ERROR: sending confirmation email FAILED');
			}
			res.json({
			msg: 'CONFIRMED!',
			info: info
			});
		});
		} else {
		return res.status(404).send('ERROR: confirming temp user FAILED');
		}
	});
	});


	return router;
}

