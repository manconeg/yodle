var express = require('express');
var glob = require('glob');

var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var compress = require('compression');
var methodOverride = require('method-override');

module.exports = function(app, config) {
  var env = process.env.NODE_ENV || 'development';
  app.locals.ENV = env;
  app.locals.ENV_DEVELOPMENT = env == 'development';

  app.use(logger('dev'));
  app.use(compress());
  app.use(methodOverride());
  app.use(bodyParser.json());

  app.use('/v1/swagger.json', function(req, res, next) {
    var yamljs = require('yamljs');

    var fs = require('fs');
    fs.readFile(__dirname + '/../api/swagger/swagger.yaml', 'utf8', function(err, data) {
      var swagger = yamljs.parse(data);

      res.send(swagger);
    });
  });

  var yeti = require('../api/controllers/yeti');
  app.post('/mailing-list', yeti.mailingList);

  app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

  app.use(function (err, req, res, next) {

    var errorObj = '';
    if(err.results) errorObj = err.results.errors;
    else errorObj = err;

    // app.get('yodle').log('severe', errorObj, '500');
    // TODO: remove console log
    console.log("Error:");
    console.log(errorObj);

    res.status(err.status || 500);
    res.send({
      status: err.status || 500,
      message: err.toString()
    });
  });

};
