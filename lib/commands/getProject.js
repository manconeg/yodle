'use strict';

module.exports = {
  name: 'getProject',
  execute: function(project) {
    let projectId = project ? project : this.config.project;
    return this.api.call({}, '/projects/' + projectId, 'GET');
  }
};
