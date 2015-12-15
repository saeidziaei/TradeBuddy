var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');


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
var nev = require('email-verification')(mongoose);

mongoose.connect(dbConfig.url);

var User = require('./models/user.js');




// Configuring Passport
var passport = require('passport');
var expressSession = require('express-session');
// TODO - Why Do we need this key ?
app.use(expressSession({ secret: 'mySecretKey' }));
app.use(passport.initialize());
app.use(passport.session());

// Using the flash middleware provided by connect-flash to store messages in session
// and displaying in templates
var flash = require('connect-flash');
app.use(flash());

var i18n = require('i18next');
i18n.init({
  ns: {
    namespaces: ['ns.common', 'ns.special'],
    defaultNs: 'ns.special'
  },
  resSetPath: '/public/locales/__lng__/new.__ns__.json',
  saveMissing: true,
  debug: true,
  sendMissingTo: 'fallback',
  // preload: ['en', 'de'],
  preload: ['en'],
  detectLngFromPath: 0,
  ignoreRoutes: ['img/', 'img', 'img/', '/img/', 'css/', 'i18next/']
}, function(t) {

  console.log('i18n is initialized.');

  i18n.addRoute('/:lng', ['en', 'de'], app, 'get', function(req, res) {
    console.log('SEO friendly route ...');
    res.render('index');
  });

  i18n.addRoute('/:lng/route.imprint', ['en', 'de'], app, 'get', function(req, res) {
    console.log("localized imprint route");
    res.render('imprint');
  });

});
app.use(i18n.handle); // have i18n befor app.router

i18n.registerAppHelper(app)
  .serveClientScript(app)
  .serveDynamicResources(app)
  .serveMissingKeyRoute(app);

i18n.serveWebTranslate(app, {
  i18nextWTOptions: {
    languages: ['de-DE', 'en-US', 'dev'],
    namespaces: ['ns.common', 'ns.special'],
    resGetPath: "locales/resources.json?lng=__lng__&ns=__ns__",
    resChangePath: 'locales/change/__lng__/__ns__',
    resRemovePath: 'locales/remove/__lng__/__ns__',
    fallbackLng: "dev",
    dynamicLoad: true
  }
});



// Initialize Passport
var initPassport = require('./passport/init');
initPassport(passport);



var routes = require('./routes/index')(passport);
app.use('/', routes);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});


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
