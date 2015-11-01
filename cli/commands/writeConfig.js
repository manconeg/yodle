var Promise = require('promise');

module.exports = {
  name: 'writeConfig',
  usage: 'save()',
  description: 'saves the current config to ~/.yodle/.config',
  alias: [
    'writeConfig',
    'save'
  ],
  execute: function() {
    return new Promise(function (_resolve, _reject) {
      var fs = require('fs');

      var file;
      if(global.yodle.configFile) {
        file = global.yodle.configFile;

        var pathTo = file.split('/config.json')[0];

        if(!fs.existsSync(pathTo)) fs.mkdirSync(pathTo);
      } else {
        file = './config.json';
      }

      fs.writeFile(file, JSON.stringify(global.yodle.config), function(err) {
        _resolve("Done");
      });
    });
  }
};