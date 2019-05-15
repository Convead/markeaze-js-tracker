const config = require('../config')
const Request = require('./request')

module.exports = {
  send (message, file, line, func = '', params = {}) {
    const data = {
      errors: [
        {
          type: 'error',
          message: message,
          backtrace: [{
            file: file,
            line: line,
            function: func
          }]
        }
      ],
      context: {
        language: 'JavaScript',
        environment: 'js_client',
        userId: config.uid,
        url: window.location.href
      },
      environment: 'js_client',
      params: params
    }
    const url = `https://airbrake.io/api/v3/projects/${config.airbrakeProject}/notices?key=${config.airbrakeApiKey}`;
    
    (new Request).send(url, data)
  }
}
