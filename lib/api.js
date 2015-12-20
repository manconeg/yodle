'use strict';

var Promise = require('promise');
var querystring = require('querystring');
var debug = require('debug')('yodle');

function Api(config) {
  this.config = config;
}

function configureWithProxy(url, port) {
  if (process.env.http_proxy != null) {
    let match = process.env.http_proxy.match(/^(http:\/\/)?([^:\/]+)(:([0-9]+))?/i);

    if (match) {
      return {
        host: match[2],
        port: (match[4] != null ? match[4] : 80),
        headers: {
          Host: url
        },
        path: 'http://' + url + ':' + port
      };
    }
  } else {
    return false
  }
}

function getOptions(url, port) {
  var config = configureWithProxy(url, port)

  if(!config) config = {
    host: url,
    port: port,
    path: '',
    headers: {}
  }

  config['Content-Type'] = 'application/json'

  if(this.config.token) {
    options.headers['x-access-token'] = this.config.token;
  }

  return config
};

Api.prototype.call = function(data, path, method) {
  return new Promise(function (_resolve, _reject) {
    var query = "";
    var postData = "";

    if(method === "GET") {
      query = querystring.stringify(data);
      if(query.length > 0) query = "?" + query;
    } else {
      postData = JSON.stringify(data);
    }

    var options = getOptions(this.config.server, this.config.port).bind(this);

    options.path += path + query;
    options.method = method;
    options.headers['Content-Length'] = postData.length;

    var http = require('http');

    var request = http.request(options, function (res) {
      var data = "";
      res.on('data', function (chunk) {
        data += chunk;
      });
      res.on('end', function () {
        debug("transmission over");
        if (res.statusCode !== 200 && res.statusCode !== 303) {
          debug("failure " + res.statusCode);
          console.log(data);
          _reject(data);
        } else {
          if(data) data = JSON.parse(data);
          _resolve(data);
        }
      });

      debug("start http request with options");
      debug(options);
    });

    request.on('error', function (e) {
      debug("error");
      debug(e);
      _reject();
    });

    request.write(postData);
    request.end();
  }.bind(this));
};

var api = module.exports = exports = Api;
