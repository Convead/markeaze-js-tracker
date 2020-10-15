import 'regenerator-runtime'
import app from './src/javascripts/app'
import notifier from './src/javascripts/libs/notifier'

notifier.call(() => app.ready('mkz') )
