'use strict';

// global.TUNGUS_DB_OPTIONS =  { nativeObjectID: true };

var express = require('express'),
  config = require('./config/config'),
  glob = require('glob'),
  SwaggerExpress = require('swagger-express-mw'),
  debug = require('debug')('yodle'),
  // tungus = require('tungus'),
  mongoose = require('mongoose'),
  jwt = require('jsonwebtoken');

// var yodle = require('../yodle').getInstance({
//   project: '563d06b65135c011002ff49c',
//   server: 'yodle.yetilogs.com'
// });

var app = express();
// app.set('yodle', yodle);

// ************************************************************************************
// Mongoose config
// ************************************************************************************

process.env.DB = config.DB;
mongoose.connect(config.DB);
var db = mongoose.connection;
db.on('error', function (err) {
  debug(err);
  throw new Error('unable to connect to database at ' + config.db);
});

var models = glob.sync(config.root + '/api/models/mongo/*.js');
models.forEach(function (model) {
  require(model);
});

// ************************************************************************************
// Security functions
// ************************************************************************************

function tokenHandler(token, callback) {
  if (token) {
    jwt.verify(token, config.secret, function(err, decoded) {
      if (err) {
        debug("Failed authentication");
        callback(new Error("Failed to authenticate token"), null);
      } else {
        debug("Authenticated as " + decoded);
        callback(null, decoded);
      }
    });
  } else {
    debug("No token provided");
    callback(new Error("No token provided"), null);
  }
}

var tokenlessRequestTypes = [
  {
    method: '*',
    regex: /^\/users\/auth$/
  },
  {
    method: '*',
    regex: /^\/users$/
  },
  {
    method: 'POST',
    regex: /^\/projects\/[a-z0-9]{24}\/entries$/
  }
]

function isTokenNeeded(request) {
  var tokenNeeded = true

  tokenlessRequestTypes.map((requestData) => {
    if(requestData.method === '*' || requestData.method === request.method) {
      if(request._parsedUrl.pathname.match(requestData.regex)) {
        tokenNeeded = false
      }
    }
  })
  return tokenNeeded
}

function verifyTokenInHeader(request, securityDefinition, scopes, callback) {
  if(!isTokenNeeded(request)) {
    return callback();
  }

  tokenHandler(request.headers['x-access-token'], (err, user) => {
    if(err) {
      return callback(err)
    }
    request.user = user
    callback()
  });
}

// ************************************************************************************
// Let's set up CORS + swagger
// ************************************************************************************

SwaggerExpress.create({
  appRoot: __dirname
}, function(err, swaggerExpress) {
  if (err) { throw err; }

  app.use(function(req, res, next) {
    if(!res.headers) res.headers = {};

    var origin = '*';
    if(req.headers.origin) origin = req.headers.origin;

    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Access-Token, Location');
    res.setHeader('Access-Control-Allow-Credentials', true);

    if(req.method === "OPTIONS") {
      res.statusCode = 200;
      res.send({
        status: 200,
        message: "okay"
      });
      return;
    }

    return next();
  });

  app.use(swaggerExpress.runner.swaggerTools.swaggerUi());

  swaggerExpress.runner.config.swagger.securityHandlers = {
    'X-Access-Token': verifyTokenInHeader
  };

  // install middleware
  app.use(swaggerExpress.metadata());
  app.use(swaggerExpress.security());
  app.use(swaggerExpress.validator());
  app.use(swaggerExpress.expressCompatibilityMW());
  app.use(swaggerExpress.router());

  require('./config/express')(app, config);
});


// ************************************************************************************
// Configure auth driver
// ************************************************************************************

global.authDriver = require('./api/db/mongo/user');
global.secret = config.secret;

// ************************************************************************************
// It's socket time
// ************************************************************************************

var server = require('http').Server(app);
var io = require('socket.io')(server);

global.io = io;

// io.use(function(socket, next){
//   next();
// });

io.on('connection', function (socket) {
  socket.auth = false;
  socket.on('authenticate', function(data){
    tokenHandler(data.token, function(err, success){
      if (!err && success){
        debug("Authenticated socket ", socket.id);
        socket.auth = success;
        socket.emit('authenticated');
        socket.join(data.room);
      } else {
        debug("Authentication failed for socket");
        socket.emit('unauthorized');
        socket.auth = false;
      }
    });
  });

  setTimeout(function() {
    //If the socket didn't authenticate, disconnect it
    if (!socket.auth) {
      debug("Disconnecting socket ", socket.id);
      socket.disconnect('unauthorized');
    }
  }, 1000);
});


// ************************************************************************************
// Socket time is over, back to normal time
// ************************************************************************************

server.listen(config.port);
