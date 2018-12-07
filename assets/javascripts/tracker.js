const eEmit = require('./libs/eEmit')
const toSnakeCase = require('./libs/toSnakeCase')
const log = require('./libs/log')
const Request = require('./libs/request')
const robotDetection = require('./libs/robot_detection.coffee')
const config = require('./config')

module.exports = {
  send (eventName, properties, callback) {

    // basic data
    const data = {}
    data.app_key = config.appKey
    data.type = toSnakeCase.convert( eventName.replace(/^track/gi, '') )
    data.tracker_ver = config.version
    data.tracker_name = config.trackerName
    data.performed_at = Math.floor(Date.now() / 1000)

    // visitor
    data.visitor = config.visitor ? config.visitor : {}
    data.visitor.device_uid = config.uid

    // event properties
    if (properties) data.properties = properties

    log.push('track', data)
    eEmit.emit('track.before', data)

    if (config.demoResponse) {

      const response = {
        status: 'OK',
        web_forms: [
          {
            id: 1,
            display_type: 'notice',
            body_html: '<form class="mkz-widget__workarea" style="background-color: #eee; width: 300px; min-height: 100px; border: 1px solid #333; padding: 10px;">Example</form>',
            on_exit: false,
            after_page_timeout: 0,
            after_page_scroll: 0,
            close_timeout: 0,
            max_showing_count: 0,
            settings: {
              position: 'top-left',
              action_color: '#9a9a9a',
              sending_notice_enable: 'true',
              sending_notice_html: 'Success'
            }
        }]
      }

      eEmit.emit('track.after', {post: data, response: response})
      if (callback) callback(data, response)

    } else {

      (new Request).send(
        '//' + config.endpoint + '/event',
        (response) => {
          if (response == 'Bot detected!') robotDetection.detect()
          eEmit.emit('track.after', {post: data, response: response})
          if (callback) callback(data, response)
        },
        (e) => {
          log.push('xhr', e)
        }
      )

    }
  }
}
