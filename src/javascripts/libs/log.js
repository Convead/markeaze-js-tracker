import store from '../store'

export default {
  push () {
    // debug mode
    if (store.debugMode == true) {
      const arg = Object.values(arguments).splice(1, arguments.length)
      console.log('%cMarkeaze [' + arguments[0] + ']', 'color:#42c4e5;font-weight:bold;', ...arg)
    }
  }
}
