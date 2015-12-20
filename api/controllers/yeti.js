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

        client.contacts.list((r) => {

          return res.send({
            success: "did it",
            count: r.body.total_count
          });

        })

      });

    } else {
      res.statusCode = 403
      res.send({
        status: 403,
        error: 4,
        message: 'exists'
      })
    }
  });
}
