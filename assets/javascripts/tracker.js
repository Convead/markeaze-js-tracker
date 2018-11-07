let request = require('./libs/request')
let eEmit = require('./libs/eEmit')
let toSnakeCase = require('./libs/toSnakeCase')
let log = require('./libs/log')
let config = require('./config')

module.exports = {
  send (eventName, properties, data, context, truePerformedAt, callback) {

    // basic data
    data = data || {}
    data.app_key = config.appKey
    data.event = toSnakeCase.convert( eventName.replace(/^track/gi, '') )
    data.tracker_sent_at = (new Date()).toISOString()
    data.tracker_ver = config.version
    data.tracker_name = config.trackerName
    if (truePerformedAt) {
      data.true_performed_at = String(truePerformedAt)
    }

    // visitor
    data.visitor = config.visitor ? config.visitor : {}
    data.visitor.uid = config.uid

    // event properties
    if (properties) data.event_properties = JSON.stringify(properties)
    
    // context
    if (context) data.context = JSON.stringify(context)

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