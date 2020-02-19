const eEmit = require('./libs/eEmit')
const toSnakeCase = require('./libs/toSnakeCase')
const log = require('./libs/log')
const Request = require('./libs/request')
const robotDetection = require('./libs/robot_detection.coffee')
const store = require('./store')
const AssetsLoader = require('./assetsLoader').default
const assetsLoader = new AssetsLoader()

module.exports = {
  send (eventName, properties, callback, visitor = null) {

    if (robotDetection.is_bot() || !store.appKey) {
      log.push('tracker', 'abort')
      return false
    }

    // Basic data
    const data = {}
    data.app_key = store.appKey
    data.type = toSnakeCase.convert( eventName.replace(/^track/gi, '') )
    data.tracker_ver = store.version
    data.tracker_name = store.trackerName
    data.performed_at = Math.floor(Date.now() / 1000)
    if (store.assets) data.assets_version = store.assets.version

    // Visitor
    data.visitor = visitor || Object.assign({}, store.visitor ? store.visitor : {})
    data.visitor.device_uid = store.uid

    // Event properties
    if (properties) data.properties = properties

    eEmit.emit('track.before', data)
    log.push('tracker', data);

    if (store.trackEnabled) {
      (new Request).send(
        store.trackerCustomUrl || `//${store.trackerEndpoint}/event`,
        data,
        (response) => {
          this.assets(data, response)

          eEmit.emit('track.after', {post: data, response: response})
          if (callback) callback(data, response)
        },
        (xhr) => {
          if (xhr.status === 200) return
          if (xhr.status === 403 || xhr.status === 0) robotDetection.detect()
          log.push('tracker', 'fail', xhr)
        }
      )
    }

  },
  assets (data, response) {
    if (data.type !== 'page_view') return
    // Should run when assets is first loaded or updated
    if (!assetsLoader.parse(response.assets)) return
    eEmit.emit('assets', store.assets)
  }
}
