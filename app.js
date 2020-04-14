import '@babel/polyfill'
import app from './assets/javascripts/app'
import notify from './assets/javascripts/libs/notify'

notify.call(() => app.ready('mkz'))
