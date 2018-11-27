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

      eEmit.emit('track.after', {post: data, response: response})
      if (callback) callback(data, response)

    } else {

      const xhr = new XMLHttpRequest()
      xhr.open('POST', '//' + config.endpoint + '/event', true)
      xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8')
      xhr.onreadystatechange = () => { 
        if (xhr.readyState == 4 && xhr.status == 200) {
          const response = JSON.parse(xhr.responseText)
          eEmit.emit('track.after', {post: response, response: data})
          if (callback) callback(data, response)
        }
      }
      xhr.send(JSON.stringify(data))
      xhr.onerror = (e) => {
        log.push('xhr', e)
      }

    }
  }
}
