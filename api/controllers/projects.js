var mongoDriver = require('../db/mongo/project');

module.exports = {
  addProjectUser: addProjectUser,
  createProject: createProject,
  createLog: createLog,
  getProjects: getProjects,
  getProject: getProject,
  getProjectEntries: getProjectEntries,
  getProjectEntry: getProjectEntry,
  getProjectUsers: getProjectUsers,
  removeProjectUser: removeProjectUser,
  getProjectTags: getProjectTags
};

function getProjects(req, res, next) {
  mongoDriver.getProjects({
    user: req.user._id
  }).then((projects) => {
    res.send(projects);
  }, (err) => {
    // TODO: Log error
  });
}

function getProjectTags(req, res, next) {
  var project = req.swagger.params.projectId.value;

  var searchOptions = {
    user: req.user._id,
    metaOnly: false
  };

  mongoDriver.getProjectTags(project, searchOptions, []).then(
    (tags) => {
      res.send(tags);
    }, () => {
      res.statusCode = 404;
      res.send({
        status: 404,
        message: 'Are you snooping? We couldn\'t find any tags for that request.'
      });
    });
}

function getProject(req, res, next) {
  var project = req.swagger.params.projectId.value;

  mongoDriver.getProject(project, {
    user: req.user._id
  }).then((project) => {
    res.send(project);
  }, () => {
      res.statusCode = 404;
      res.send({
        status: 404,
        message: 'Are you snooping? We couldn\'t find the project you\'re looking for.'
      });
  });
}

function createProject(req, res, next) {
  var project = {};

  project.users = req.swagger.params.project.value.users ? req.swagger.params.project.value.users : [];
  project.entries = req.swagger.params.project.value.entries ? req.swagger.params.project.value.entries : [];
  project.name = req.swagger.params.project.value.name;

  if(project.users.indexOf(req.user._id) === -1) project.users.push(req.user._id);

  mongoDriver.createProject(project).then((project) => {
    res.statusCode = 200;
    res.setHeader('Location', '/projects/' + project.id);
    res.send(project);
  }, (err) => {
    res.statusCode = 500;
    res.send({
      status: 500,
      message: 'Weird error to get here. Nothing should be going wrong...'
    });
  });

}

function getProjectEntries(req, res, next) {
  var project = req.swagger.params.projectId.value;

  var query = {};
  var searchOptions = {
    user: req.user._id,
    metaOnly: false
  };
  for(var i in req.query) {
    if(i === 'metaOnly') {
      if(req.query[i] === 'true') searchOptions.metaOnly = true;
    } else {
      query['entries.' + i] = { $regex: req.query[i] };
    }
  }

  mongoDriver.getProjectEntries(project, searchOptions, query).then(
    (entries) => {
      res.send(entries);
    }, () => {
      res.statusCode = 404;
      res.send({
        status: 404,
        message: 'Are you snooping? We couldn\'t find the project you\'re looking for.'
      });
    });
}

function getProjectUsers (req, res, next) {
  var project = req.swagger.params.projectId.value;

  mongoDriver.getProjectUsers(project, {
    user: req.user._id
  }).then((users) => {
    res.send(users);
  }, () => {
    res.statusCode = 404;
    res.send({
      status: 404,
      message: 'Are you snooping? We couldn\'t find the project you\'re looking for.'
    });
  });
}

function addProjectUser(req, res, next) {
  var project = req.swagger.params.projectId.value;
  var searchOptions = {
    user: req.user._id
  };
  var user = req.swagger.params.user.value.email;

  mongoDriver.addProjectUser(project, searchOptions, user).then(() => {
    res.statusCode = 200;
    res.send({
      status: 200,
      message: "User added"
    });
  }, (code, message) => {
    res.statusCode = code;
    res.send({
      status: code,
      message: message
    });
  });
}

function removeProjectUser(req, res, next) {
  var project = req.swagger.params.projectId.value;
  var searchOptions = {
    user: req.user._id
  };
  var user = req.swagger.params.user.value;

  mongoDriver.removeProjectUser(project, searchOptions, user).then(() => {
    res.statusCode = 200;
    res.send({
      status: 200,
      message: "User removed"
    });
  }, (code, message) => {
    res.statusCode = code;
    res.send({
      status: code,
      message: message
    });
  });
}

function getProjectEntry(req, res, next) {
  var project = req.swagger.params.projectId.value;
  var entry = req.swagger.params.entryId.value;


  mongoDriver.getProjectEntry(project, {
    user: req.user._id
  }).then((entries) => {
    entries.forEach((subEntry) => {
      if(subEntry._id == entry) {
        res.send(subEntry);
      }
    });
  }, (error, message) => {
      res.statusCode = error;
      res.send({
        status: error,
        message: message
      });
  });
}

function createLog(req, res, next) {
  var project = req.swagger.params.projectId.value;

  var log = {
    level: req.swagger.params.entry.value.level,
    message: req.swagger.params.entry.value.message,
    code: req.swagger.params.entry.value.code,
    tags: [].concat(req.swagger.params.entry.value.tags),
    time: new Date(),
    ip: req.connection.remoteAddress
  };

  mongoDriver.createLog(project, log).then((entry) => {
    // TODO make util for this
    console.log(entry.ip + ": " + entry.level + ' [' + entry.code + '] - ' + JSON.stringify(entry.message));

    global.io.to(project).emit('log', entry);

    res.statusCode = 200;
    res.setHeader('Location', '/projects/' + project + '/entries/' + entry.id);
    res.send(entry);
  }, (error, message) => {
    res.statusCode = error;
    res.send({
      status: error,
      message: message
    });
  });
}
