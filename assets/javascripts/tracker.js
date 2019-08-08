const eEmit = require('./libs/eEmit')
const toSnakeCase = require('./libs/toSnakeCase')
const log = require('./libs/log')
const Request = require('./libs/request')
const robotDetection = require('./libs/robot_detection.coffee')
const config = require('./config')

module.exports = {
  send (eventName, properties, callback, visitor = null) {

    if (robotDetection.is_bot()) return false

    // basic data
    const data = {}
    data.app_key = config.appKey
    data.type = toSnakeCase.convert( eventName.replace(/^track/gi, '') )
    data.tracker_ver = config.version
    data.tracker_name = config.trackerName
    data.performed_at = Math.floor(Date.now() / 1000)
    if (config.assetsVersion) data.assets_version = config.assetsVersion

    // visitor
    data.visitor = visitor || Object.assign({}, config.visitor ? config.visitor : {})
    data.visitor.device_uid = config.uid

    // event properties
    if (properties) data.properties = properties

    eEmit.emit('track.before', data);
    log.push('track', data);

    if (config.trackEnabled) {
      (new Request).send(
        `//${config.endpoint}/event`,
        data,
        (response) => {
          eEmit.emit('track.after', {post: data, response: response})
          if (callback) callback(data, response)
        },
        (xhr) => {
          if (xhr.status == 403 || xhr.status == 0) robotDetection.detect()
          log.push('track fail', xhr)
        }
      )
    }

  }
}
