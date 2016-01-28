'use strict';

module.exports = {
  name: 'useProject',
  execute: function(name) {
    let matchedProject = null
    return this.api.call({}, '/projects/?' + 'search=' + name, 'GET').then((projects) => {

      if(projects.length) {
        var regex = new RegExp(".+" + name);

        projects.forEach(project => {
          if(regex.exec(project._id)) {
            matchedProject = project
          }
        })

        if(matchedProject) {
          this.reconfig({ project: matchedProject._id })
        }
      }
      return matchedProject;
    });
  }
};
