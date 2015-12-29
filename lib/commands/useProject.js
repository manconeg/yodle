'use strict';

module.exports = {
	name: 'useProject',
  execute: function(name) {
    return this.api.call({}, '/projects/?' + 'search=' + name, 'GET').then((projects) => {
      let project;
      if(projects.length) {
        project = projects[0];
        this.reconfig({ project: project._id })
      }
      return project;
    });
	}
};
