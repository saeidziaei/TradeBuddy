var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var middleware = require('i18next-express-middleware');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// this is just a comment to test git setup. more
var dbConfig = require('./db.js');
    
var mongoose = require('mongoose');

 
mongoose.connect(dbConfig.url);


/*
var moneyMex = require("./third_party/ticker/moneymex.js");
moneyMex.getRates(function(rates){
  console.log(rates);
});
*/

var Bitstamp = require('bitstamp');
var bitstamp = new Bitstamp;


// update ticker every minute
  bitstamp.ticker(function (err, data) {
    console.log(data);
    app.locals.bitstamp = data;
  });
/*
var minutes = .1, interval = minutes * 60 * 1000;
setInterval(function () {
  bitstamp.ticker(function (err, data) {
    console.log(data);
    app.locals.bitstamp = data;
  });
}, interval);
*/


// Configuring Passport
var passport = require('passport');
var expressSession = require('express-session');
// TODO - Why Do we need this key ?
app.use(expressSession({ secret: 'Some very scary key' }));
app.use(passport.initialize());
app.use(passport.session());

// Using the flash middleware provided by connect-flash to store messages in session
// and displaying in templates
var flash = require('connect-flash');
app.use(flash());


// Initialize Passport
var initPassport = require('./passport/init');
initPassport(passport);


var i18next = require('i18next');
var middleware = require('i18next-express-middleware');


i18next
    .use(middleware.LanguageDetector)
    .init({
    //lng: 'en',  // disables detection
    detection: {
        // order and from where user language should be detected
        order: [/*'path',*/ 'querystring', 'session', 'cookie', 'header'],

        // keys or params to lookup language from
        lookupQuerystring: 'lng',
        lookupCookie: 'i18next',
        lookupSession: 'lng',
        lookupFromPathIndex: 0,

        // cache user language
        caches: false, // ['cookie']

        // optional expire and domain for set cookie
        cookieExpirationDate: new Date(),
        cookieDomain: 'myDomain'
    }
 ,resources: require("./resources.json")
}, function(err, t) {
  // initialized and ready to go!
  var hw = t('key'); 
  console.log(hw);
  console.log(t('common.OK', {lng : 'en'}));
  console.log(t('common.OK', {lng : 'fa'}));
});

app.use(middleware.handle(i18next, {
  ignoreRoutes: ["/foo"],
  removeLngFromUrl: false
}));


app.use(function(req, res, next){
    // var lng = req.param('lng');
    var lng = req.query.lng;
    if (lng){
        console.log("Change request language to " + lng);
        req.session.lng = lng;
    }
    next();
});

app.get('/myroute', function(req, res) {
  res.render('home', {title: req.t('key')});
});


var routes = require('./routes/index')(passport);
app.use('/', routes);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});





// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});



module.exports = app;
