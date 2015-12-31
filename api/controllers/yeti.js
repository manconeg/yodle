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



function sendMandrill(email) {
  var template_name = "You joined the waitlist"
  var template_content = [{
    "name": "example name",
    "content": "example content"
  }]

  var message = {
    "html": "<p>Example HTML content</p>",
    "text": "Example text content",
    "subject": "example subject",
    "from_email": "message.from_email@example.com",
    "from_name": "Example Name",
    "to": [{
            "email": email,
            "name": "Recipient Name",
            "type": "to"
        }],
    "headers": {
        "Reply-To": "message.reply@example.com"
    },
    "important": false,
    "track_opens": null,
    "track_clicks": null,
    "auto_text": null,
    "auto_html": null,
    "inline_css": null,
    "url_strip_qs": null,
    "preserve_recipients": null,
    "view_content_link": null,
    "bcc_address": "message.bcc_address@example.com",
    "tracking_domain": null,
    "signing_domain": null,
    "return_path_domain": null,
    "merge": true,
    "merge_language": "mailchimp",
    "tags": [
        "waitlist-welcome"
    ]
  }
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
          /*
          {
              "slug": "example-template",
              "name": "Example Template",
              "labels": [
                  "example-label"
              ],
              "code": "<div mc:edit=\"editable\">editable content</div>",
              "subject": "example subject",
              "from_email": "from.email@example.com",
              "from_name": "Example Name",
              "text": "Example text",
              "publish_name": "Example Template",
              "publish_code": "<div mc:edit=\"editable\">different than draft content</div>",
              "publish_subject": "example publish_subject",
              "publish_from_email": "from.email.published@example.com",
              "publish_from_name": "Example Published Name",
              "publish_text": "Example published text",
              "published_at": "2013-01-01 15:30:40",
              "created_at": "2013-01-01 15:30:27",
              "updated_at": "2013-01-01 15:30:49"
          }
          */
      }, function(e) {
        _reject(e)
          // Mandrill returns the error as an object with name and message keys
          console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
          // A mandrill error occurred: Invalid_Key - Invalid API key
      }
    )
  })
}






function mailingList(req, res, next) {
  var email = req.body.email

  var count = 0
  mc.call('lists', 'list', {
    filters: {
      list_id: '555aea8b9b'
    }
  }, (error, data) => {
    count = data.data[0].stats.member_count + 1
  })


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
        sendMandrill(email).then(result => {
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
  });
}
