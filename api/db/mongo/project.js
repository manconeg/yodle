'use strict';

var Promise = require('promise'),
  mongoose = require('mongoose'),
  Project = mongoose.model('Project'),
  Entry = mongoose.model('Entry');

// import { Db, ObjectID, MongoClient, Server } = require('mongodb');
var Db = require('mongodb').Db,
    ObjectID = require('mongodb').ObjectID,
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server;

var database;
MongoClient.connect(process.env.DB, function(err, db) {
  database = db;
});

class MongoDriver {}

MongoDriver.getProjects = function(searchOptions) {
  searchOptions = searchOptions ? searchOptions : {};

  return new Promise((_resolve, _reject) => {
    var search = {
      users: searchOptions.user
    };

    if(searchOptions.name) search.$where = 'this._id.str.match(/' + searchOptions.name + '$/)';

    Project.find(search).lean().exec((err, projects) => {
      for(var i in projects) {
        projects[i]._id = projects[i]._id.toString();
      }

      _resolve(projects);
    });
  });
};

MongoDriver.getProject = function(project, searchOptions) {
  var project = project;
  var user = searchOptions.user;

  return new Promise((_resolve, _reject) => {
    Project.findOne({
      _id: project,
      users: user
    }, {
      entries: 1,
      users: 1
    }).lean().exec((err, project) => {
      if(project) {
        project._id = project._id.toString();
        _resolve(project);
      } else {
        _resolve(project);
      }
    });
  });
};

MongoDriver.createProject = function(projectData) {
  var project = new Project();

  project.users = projectData.users;
  project.entries = projectData.entries;
  project.name = projectData.name;

  return new Promise((_resolve, _reject) => {
    project.save((err, data) => {
      if(err) {
        _reject(err);
      } else {
        _resolve(project);
      }
    });
  });

};

MongoDriver.getFromProject = function(project, searchOptions, query) {
  var aggregate = [];

  // Setup Match
  var match = {
    // _id: new ObjectID(project),
    users: [ searchOptions.user ]
  };
  for(var i in query) {
    match[i] = query[i];
  }
  aggregate.push({
    $match: match
  });

  // Building unwinds
  for(var i in searchOptions.unwind) {
    aggregate.push({
      $unwind: "$" + searchOptions.unwind[i]
    });
 }

  // Adding groups
  var group = {
    _id: searchOptions.key,
    count: { $sum: 1 }
  };
  var name = searchOptions.path[searchOptions.path.length - 1];
  if(!searchOptions.metaOnly === true) group[searchOptions.name] = { $push: "$" + searchOptions.path };
  aggregate.push({
    $group: group
  });

  // Setup projections
  var projections = {
     _id : 0,
    count: 1
  };
  projections[searchOptions.name] = 1;
  aggregate.push({
    $project: projections
 });

// console.log(searchOptions);
// console.log(aggregate);
// console.log(match.users);
// console.log(database);
  // Making it go
  return new Promise((_resolve, _reject) => {//console.log(database);
    var cursor = database.collection('projects').aggregate(aggregate, (err, result) => {

      if(err) return _reject(err);

      _resolve(result);
    });
  });
}

MongoDriver.getProjectEntries = function(project, searchOptions, query) {
  searchOptions.path = "entries";
  searchOptions.key = "$_id";
  searchOptions.name = 'entries';
  searchOptions.unwind = [
    'entries'
  ];
// console.log(project);
// console.log(searchOptions);
// console.log(query);
  return MongoDriver.getFromProject(project, searchOptions, query).then((results) => {
    return results[0];
  }, (err, res) => { console.log("hm");console.log(err);console.log(res);} );
};

MongoDriver.getProjectTags = function(project, searchOptions, query) {
  searchOptions.path = "entries.message.tags";
  searchOptions.key = "$entries.message.tags";
  searchOptions.name = 'tags';
  searchOptions.unwind = [
    'entries',
    'entries.message.tags'
  ];

  return MongoDriver.getFromProject(project, searchOptions, query).then((results) => {
    var tags = [];
    results.forEach((entry) => {
      tags.push({
        tag: entry.tags[0],
        count: entry.count
      });
    });
    return tags;
  });
};

MongoDriver.getProjectUsers = function(project, searchOptions) {
  return new Promise((_resolve, _reject) => {
    Project.findOne({
      _id: project,
      users: searchOptions.user
    }, {
    }, function(err, project) {
      if(project && project.users) {
        _resolve(project.users);
      } else {
        _reject();
      }
    });
  });
}

MongoDriver.addProjectUser = function(project, searchOptions, user) {
  return new Promise((_resolve, _reject) => {
    Project.update({
      _id: project,
      users: searchOptions.user
    },
    {
      $push: { users: user }
    },
    {
      update: true
    }, function(err, data) {
        if(data.ok) {
          if(data.nModified === 0) {
            _reject(404, 'Invalid project - not found.');
          } else if(data.nModified === 1) {
            _resolve();
          } else {
            _reject(500, 'Are you a wizard? You just updated more than one project with this entry.');
          }
        } else {
          var error = "Unknown error...";

          // TODO: Log this.... with yodle?!

          if((err.name === "CastError") && (err.path === '_id')) {
            error = "Invalid project id!";
          }
          _reject(500, error);
        }
    });
  });
};

MongoDriver.removeProjectUser = function(project, searchOptions, user) {
  return new Promise((_resolve, _reject) => {
    Project.update({
      _id: project,
      users: searchOptions.user
    },
    {
      $pull: { users: user }
    },
    {
      update: true
    }, function(err, data) {
        if(data.ok) {
          if(data.nModified === 0) {
            _reject(404, 'Invalid project or user - not found.');
          } else if(data.nModified === 1) {
            _resolve();
          } else {
            _reject(500, 'Are you a wizard? You just updated more than one project with this entry.');
          }
        } else {
          var error = "Unknown error...";

          // TODO: Log this.... with yodle?!

          if((err.name === "CastError") && (err.path === '_id')) {
            error = "Invalid project id!";
          }
          _reject(500, error);
        }
    });
  });
};

MongoDriver.getProjectEntry = function(project, searchOptions, entry) {
  return new Promise((_resolve, _reject) => {
    Project.findOne({
      _id: project,
      users: req.decoded.email
    }, {
      'entries': 1
    }, function(err, project) {
      if(project) {
        _resolve(project.entries);
      } else {
        _reject(404, 'That project is missing! Weird.');
      }
    });
  });
};

MongoDriver.createLog = function(project, log) {
  var entry = new Entry();

  entry.level = log.level;
  entry.message = log.message;
  entry.code = log.code;

  entry.ip = log.ip;

  var createMethod = {
    update: true
  };

  return new Promise((_resolve, _reject) => {
    Project.update(
      {
        _id: project
      },
      {
        $push: { entries: entry }
      },
      createMethod, function(err, data) {
        if(data.ok) {
          if(data.nModified === 0) {
            _reject(404, 'Invalid project - not found.');
          } else if(data.nModified === 1) {
            _resolve(entry);
          } else {
            _reject(500, 'Are you a wizard? You just updated more than one project with this entry.');
          }
        } else {
          var error = "Unknown error...";

          // TODO: Log this.... with yodle?!

          if((err.name === "CastError") && (err.path === '_id')) {
            error = "Invalid project id!";
          }
          _reject(500, error);
        }
      });
  });
};

module.exports = MongoDriver;
