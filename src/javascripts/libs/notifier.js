import { Notifier } from '@airbrake/browser'
import store from '../store'

export const notifierInstance = (version, projectId, projectKey, environment) => {

  if (environment === 'production') {

    // Disable watching unhandledrejection
    Notifier.prototype.onUnhandledrejection = () => {}

    // Disable watching instrumentation methods
    Notifier.prototype._instrument = () => {}

    const airbrake = new Notifier({
      projectId,
      projectKey,
      environment,
      // instrumentation: {
      //   fetch: false,
      //   onerror: false,
      //   console: false,
      //   xhr: false
      // }
    })
    airbrake.addFilter(function(notice) {
      notice.context.version = version
      return notice
    })
    // airbrake-js automatically setups window.onerror
    // https://github.com/airbrake/airbrake-js/tree/master/packages/browser#integration
    return airbrake

  } else {

    return {
      wrap: (app) => app,
      call: function (app) { app.call(this, arguments) },
      notify: (e) => { throw e }
    }

  }
}

export default notifierInstance(store.version, store.airbrakeProject, store.airbrakeApiKey, process.env.NODE_ENV)
