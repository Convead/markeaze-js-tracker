const config = require('../config')

module.exports = {
  push (name, arg) {
    // debug mode
    if (config.debugMode == true) {
      console.log('%cMarkeaze [' + name + ']', 'color:#42c4e5;font-weight:bold;', arg)
    }
  }
}
