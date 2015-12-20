'use strict';

var glob = require('glob')
var debug = require('debug')('matcher')

function parseForMatch(command, alias) {
  var alias = '^\\s*' + alias

  alias += '(?![a-z])(\\s?\\(?([^(^)]+)\\)?)?'

  var match = command.match(alias)

  return match
}

function executeCommand(command, callback) {
  debug(command)

  for(var i in this.commands) {
    var commandCheck = this.commands[i]

    for(var aliasI in commandCheck.alias) {
      var match = parseForMatch(command, commandCheck.alias[aliasI])

      if(match) {
        debug('matched')
        debug(match)
        debug('this[' + commandCheck.name + '](' + match[2] + ')')

        eval('this[commandCheck.name](' + match[2] + ')').then(callback, callback)

        return true
      }
    }
  }
  return false
}

module.exports = exports = function(objectToExtend, functionsDirectory) {
  let commands = glob.sync(functionsDirectory)

  objectToExtend.prototype.commands = []
  objectToExtend.prototype.execute = executeCommand

  commands.forEach(function (file) {
    debug('scanned ' + file)
    var command = require(file)

    objectToExtend.prototype.commands.push(command)
    objectToExtend.prototype[command.name] = command.execute
  })
}
