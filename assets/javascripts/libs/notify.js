const store = require('../store')
const { Notifier } = require('@airbrake/browser')

if (process.env && process.env.NODE_ENV === 'production') {

  const airbrake = new Notifier({
    projectId: store.airbrakeProject,
    projectKey: store.airbrakeApiKey,
    environment: process.env.NODE_ENV
  })
  airbrake.addFilter(function(notice) {
    notice.context.version = store.version
    return notice
  })
  // airbrake-js automatically setups window.onerror
  // https://github.com/airbrake/airbrake-js/tree/master/packages/browser#integration
  module.exports = airbrake

} else {

  module.exports = {
    call: (app) => app.apply(window)
  }

}
