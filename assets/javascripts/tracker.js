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
    data.visitor.device_uid = config.uid

    // event properties
    if (properties) data.properties = JSON.stringify(properties)

    log.push('track', data)
    eEmit.emit('track.before', data)

    if (config.demoResponse) {
      const res = {
        widgets: [{
          device: null,
          id: 41708,
          type: 'notice',
          close_timeout: 0,
          html: '<form class="mkz-widget__workarea" style="background-color: #eee; width: 300px; min-height: 100px; border: 1px solid #333;">Text</form>',
          scroll_top_percent: 0,
          settings: {
            placement: 'top-left',
            action_color: '#9a9a9a',
            sending_notice_enable: 'true',
            sending_notice_html: 'Success'
          },
          timeout: 0,
          visitor_loss_detect: false,
          whitelabel: false,
          display_type: 'auto'
        }]
      }

      eEmit.emit('track.after', {post: data, response: res})
      if (callback) callback(data, res)

    } else {

      request({
        url: '//' + config.endpoint + '/event',
        type: 'json',
        method: 'post',
        data: data,
        crossOrigin: true,
        async: true,
        success (res) {
          eEmit.emit('track.after', {post: data, response: res})
          if (callback) callback(data, res)
        }
      })

    }
  }
}
