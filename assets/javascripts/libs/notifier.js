import { Notifier } from '@airbrake/browser'
import store from '../store'

export const notifierInstance = (version, projectId, projectKey, environment) => {

  if (environment === 'production') {
    const airbrake = new Notifier({
      projectId,
      projectKey,
      environment,
      instrumentation: {
        onerror: false
      }
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
