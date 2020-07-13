import { Notifier } from '@airbrake/browser'
import store from '../store'

let airbrake

if (process.env && process.env.NODE_ENV === 'production') {
  airbrake = new Notifier({
    projectId: store.airbrakeProject,
    projectKey: store.airbrakeApiKey,
    environment: process.env.NODE_ENV,
    instrumentation: {
      onerror: false
    }
  })
  airbrake.addFilter(function(notice) {
    notice.context.version = store.version
    return notice
  })
  // airbrake-js automatically setups window.onerror
  // https://github.com/airbrake/airbrake-js/tree/master/packages/browser#integration

} else {

  airbrake = {
    wrap: (app) => app,
    call: function (app) { app.call(this, arguments) },
    notify: () => {}
  }

}

export default airbrake
