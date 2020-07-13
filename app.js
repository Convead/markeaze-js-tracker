import 'regenerator-runtime'
import app from './assets/javascripts/app'
import notifier from './assets/javascripts/libs/notifier'

notifier.wrap(app).ready('mkz')
