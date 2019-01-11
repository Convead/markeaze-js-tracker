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

    // visitor
    data.visitor = visitor || Object.assign({}, config.visitor ? config.visitor : {})
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
            display_type: 'pop_up',
            body_html: '<form class="mkz-widget__workarea" style="background-color: #eee; padding: 20px;"><div class="mkz-widget_containers mkz-widget_body"><div class="mkz-widget_container mkz-widget_container_type_field"><div class="mkz-widget_component"><div style="text-align: center;margin: 10px 0;"><input class="mkz_required" id="properties_email" name="properties[email]" placeholder="Email" type="email"></div></div></div><div class="mkz-widget_container mkz-widget_container_type_button"><div class="mkz-widget_component"><div style="text-align: center;margin: 10px 0;"><button onclick="mkz.prototype.widgetSubmitHandler(event, &quot;&quot;, &quot;&quot;); ">Отправить</button></div></div></div></div></form>',
            on_exit: false,
            after_page_timeout: 0,
            after_page_scroll: 0,
            close_timeout: 0,
            max_showing_count: 0,
            settings: {
              position: 'top-left',
              action_color: '#9a9a9a',
              sending_notice_enable: 'false',
              sending_notice_html: 'Success'
            }
        }]
      }

      if (data.type != 'page_view') response.web_forms = []

      eEmit.emit('track.after', {post: data, response: response})
      if (callback) callback(data, response)

    } else {

      (new Request).send(
        '//' + config.endpoint + '/event',
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
