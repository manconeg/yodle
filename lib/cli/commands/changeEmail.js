var api = require('../../api.js');

module.exports = function(email) {
  return api.call({
    email: email
  }, '/users/me', 'PATCH')
    .then(function(json) {
      return json;
    });
};