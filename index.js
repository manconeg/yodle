'use strict';

class Yodle {
  constructor(config, api) {
    this.config = config;
  	var Api = api ? api : require('./lib/api');

    var apiConfig = {
      server: config && config.server ? config.server : 'yodle.yetilogs.com',
      port: config && config.port ? config.port : 80,
      protocol: config && config.protocol ? config.protocol : 'https',
      token: config ? config.token : ''
    };

    this.api = new Api(apiConfig);
  }

  static getInstance(config, api) {
    return new Yodle(config, api);
  }
}

Yodle.prototype.addUser = require('./lib/commands/addUser').execute;
Yodle.prototype.changeEmail = require('./lib/commands/changeEmail').execute;
Yodle.prototype.changePassword = require('./lib/commands/changePassword').execute;
Yodle.prototype.reconfig = require('./lib/commands/reconfig').execute;
Yodle.prototype.count = require('./lib/commands/count').execute;
Yodle.prototype.getLogs = require('./lib/commands/getLogs').execute;
Yodle.prototype.getProjects = require('./lib/commands/getProjects').execute;
Yodle.prototype.getProject = require('./lib/commands/getProject').execute;
Yodle.prototype.getUsers = require('./lib/commands/getUsers').execute;
Yodle.prototype.live = require('./lib/commands/live').execute;
Yodle.prototype.log= require('./lib/commands/log').execute;
Yodle.prototype.login = require('./lib/commands/login').execute;
Yodle.prototype.newProject = require('./lib/commands/newProject').execute;
Yodle.prototype.removeUser = require('./lib/commands/removeUser').execute;
Yodle.prototype.tags = require('./lib/commands/tags').execute;
Yodle.prototype.useProject = require('./lib/commands/useProject').execute;
Yodle.prototype.user = require('./lib/commands/user').execute;

exports = module.exports = Yodle;
