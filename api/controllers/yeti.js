"use strict";

var mongoDriver = require('../db/mongo/project');

// import { Db, ObjectID, MongoClient, Server } = require('mongodb');
var Db = require('mongodb').Db,
    ObjectID = require('mongodb').ObjectID,
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server;

var Intercom = require('intercom-client');
var client = new Intercom.Client({ appId: process.env.INTERCOM_APP_ID, appApiKey: process.env.INTERCOM_API_KEY });

var database;
MongoClient.connect(process.env.DB, function(err, db) {
  database = db;
});

module.exports = {
  mailingList: mailingList
};

function mailingList(req, res, next) {
  let contact = {
    email: req.body.email
  }
  client.contacts.listBy(contact, (r) => {
    if(r.body.total_count == 0) {
      client.contacts.create(contact, function (r) {
        console.log(r.status);
      });
    }
  });

  database.collection('mailingList').update(contact, contact, {
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
