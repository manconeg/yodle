"use strict";

var mongoDriver = require('../db/mongo/project');

var Db = require('mongodb').Db,
    ObjectID = require('mongodb').ObjectID,
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server;

if(process.env.MANDRILL_API_KEY) {
  var mandrill = require('mandrill-api/mandrill');
  var mandrill_client = new mandrill.Mandrill(process.env.MANDRILL_API_KEY);
}

if(process.env.MAILCHIMP_API_KEY) {
  var MailChimpAPI = require('mailchimp').MailChimpAPI;
  var mc = new MailChimpAPI(process.env.MAILCHIMP_API_KEY, { version : '2.0' });
}

module.exports = {
  mailingList: mailingList
};



function sendMandrill(email, people) {
  var template_name = "You joined the waitlist"
  var template_content = [{
    "name": "example name",
    "content": "example content"
  }]

  var message = require('../../emails/welcome.json')

  message.to = [{
    "email": email,
    "name": "Recipient Name",
    "type": "to"
  }]
  message.global_merge_vars[0].content = people
  var async = false

  return new Promise((_resolve, _reject) => {
    mandrill_client.messages.sendTemplate({
        "template_name": template_name,
        "template_content": template_content,
        "message": message,
        "async": async
      },
      function(result) {
        _resolve(result)
      }, function(e) {
        _reject(e)
        console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
      }
    )
  })
}






function mailingList(req, res, next) {
  var email = req.body.email

  var count = 1
  mc.call('lists', 'list', {
    filters: {
      list_id: '555aea8b9b'
    }
  }, (error, data) => {
    count = data.data[0].stats.member_count + 1

    mc.call('lists', 'subscribe', {
        id: '555aea8b9b',
        double_optin: false,
        email: {
          email: email
        }
      }, (error, data) => { // Success
        if(error) {
          switch(error.code) {
            case 214:
              res.statusCode = 403
              return res.send({
                status: 403,
                error: 4,
                message: 'exists'
              })
            default:
              res.statusCode = 500
              return res.send({
                status: 500,
                error: 100,
                message: 'general unrecoverable'
              })
          }

        } else {
          sendMandrill(email, count - 1).then(result => {
            switch(result[0].status) {
              case 'rejected':
                console.log(result[0]);

                res.statusCode = 500
                return res.send({
                  status: 500,
                  error: 100,
                  message: 'general unrecoverable'
                })
              default:
                return res.send({
                  success: "did it",
                  count: count
                })
            }
          }, error => { // Error sending welcome email
            res.statusCode = 403
            return res.send({
              status: 403,
              error: 100,
              message: 'general unrecoverable'
            })
          })
        }
    })
  })
}
