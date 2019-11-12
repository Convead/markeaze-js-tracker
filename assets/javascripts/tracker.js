const eEmit = require('./libs/eEmit')
const toSnakeCase = require('./libs/toSnakeCase')
const log = require('./libs/log')
const Request = require('./libs/request')
const robotDetection = require('./libs/robot_detection.coffee')
const store = require('./store')

module.exports = {
  send (eventName, properties, callback, visitor = null) {

    if (robotDetection.is_bot()) return false

    // basic data
    const data = {}
    data.app_key = store.appKey
    data.type = toSnakeCase.convert( eventName.replace(/^track/gi, '') )
    data.tracker_ver = store.version
    data.tracker_name = store.trackerName
    data.performed_at = Math.floor(Date.now() / 1000)
    if (store.assetsVersion) data.assets_version = store.assetsVersion

    // visitor
    data.visitor = visitor || Object.assign({}, store.visitor ? store.visitor : {})
    data.visitor.device_uid = store.uid

    // event properties
    if (properties) data.properties = properties

    eEmit.emit('track.before', data);
    log.push('track', data);

    if (store.trackEnabled) {
      (new Request).send(
        `//${store.endpoint}/event`,
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
