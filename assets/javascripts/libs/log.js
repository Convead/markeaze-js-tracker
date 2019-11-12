const store = require('../store')

module.exports = {
  push (name, arg) {
    // debug mode
    if (store.debugMode == true) {
      console.log('%cMarkeaze [' + name + ']', 'color:#42c4e5;font-weight:bold;', arg)
    }
  }
}
