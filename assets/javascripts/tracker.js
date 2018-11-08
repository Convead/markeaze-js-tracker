let request = require('./libs/request')
let eEmit = require('./libs/eEmit')
let toSnakeCase = require('./libs/toSnakeCase')
let log = require('./libs/log')
let config = require('./config')

module.exports = {
  send (eventName, properties, callback) {

    // basic data
    const data = {}
    data.app_key = config.appKey
    data.type = toSnakeCase.convert( eventName.replace(/^track/gi, '') )
    data.tracker_ver = config.version
    data.tracker_name = config.trackerName
    data.performed_at = (new Date()).toISOString()

    // visitor
    data.visitor = config.visitor ? config.visitor : {}
    data.visitor.uid = config.uid

    // event properties
    if (properties) data.properties = JSON.stringify(properties)

    log.push('track', data)
    eEmit.emit('track.before', data)
    request({
      url: '//' + config.endpoint + '/event',
      type: 'json',
      method: 'post',
      data: data,
      crossOrigin: true,
      async: true,
      success (res) {
        eEmit.emit('track.after', data)
        if (callback) callback()
      }
    })
  }
}
