var mongoDriver = require('../db/mongo/project');

// import { Db, ObjectID, MongoClient, Server } = require('mongodb');
var Db = require('mongodb').Db,
    ObjectID = require('mongodb').ObjectID,
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server;

var database;
MongoClient.connect(process.env.DB, function(err, db) {
  database = db;
});

module.exports = {
  mailingList: mailingList
};

function mailingList(req, res, next) {
  database.collection('mailingList').update({
    email: req.body.email
  }, {
    email: req.body.email
  }, {
    upsert: true
  }, (err, result) => {
    if(err) {
      res.statusCode = 500;
      res.send({
        status: 500,
        message: err
      });
    }

    return res.send({
      success: "did it"
    });
  });
}
