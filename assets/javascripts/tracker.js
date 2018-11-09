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

    if (config.demoResponse) {

      const res = {
        widgets: [{
          device: null,
          id: 41708,
          slug: null,
          type: "pop_up",
          close_timeout: 0,
          html: "<form class=\"mkz-widget__workarea mkz-widget__workarea_reset_yes\" style=\"color: #000000;width: 740px;min-height: 456px;padding-top: 0px;border-color: #bdbdbd;border-style: none;border-width: 1px;padding-left: 0px;border-radius: 5px;padding-right: 0px;padding-bottom: 0px;background-color: #ffffff;background-image: url(https://d2p70fm3k6a3cb.cloudfront.net/public/widgets/predefined/wheel_of_fortune_bg.gif);background-repeat: repeat;\" novalidate=\"true\">Test</form>",
          scroll_top_percent: 0,
          settings: {
            action_color: "#9a9a9a",
            'background-color': "#ffffff",
            'background-image': "url(https://d2p70fm3k6a3cb.cloudfront.net/public/widgets/predefined/wheel_of_fortune_bg.gif)",
            'background-repeat': "repeat",
            'border-color': "#bdbdbd",
            'border-radius': "5px",
            'border-style': "none",
            'border-width': "1px",
            color: "#000000",
            'min-height': "456px",
            'padding-bottom': "0px",
            'padding-left': "0px",
            'padding-right': "0px",
            'padding-top': "0px",
            'sending_notice_enable': "true",
            'sending_notice_html': "<div style=\"text-align: center; padding: 60px 0;\">↵<p><span style=\"font-size: 18pt; line-height: 120%;\" id=\"mkz-win\"><span style=\"font-size: 18pt;\"><img src=\"https://d2p70fm3k6a3cb.cloudfront.net/public/widgets/predefined/wheel_of_fortune_win.png\" alt=\"\" style=\"display: inline-block;width: 100px; height: 100px;\" /><br /><br />О да! Это Ваш день!</span><br /><span style=\"font-size: 18pt;\">Проверьте почту, туда уже летит промокод.</span></span> <span style=\"font-size: 18pt; line-height: 120%;\" id=\"mkz-lose\"> <br /><img src=\"https://d2p70fm3k6a3cb.cloudfront.net/public/widgets/predefined/wheel_of_fortune_loose.png\" alt=\"\" style=\"display: inline-block;width: 80px; height: 80px;\" /><br /><br />Не расстраивайтесь!<br />Сегодня не повезло.</span></p>↵<p style=\"margin: 40px 0;\"><button style=\"outline: 0; line-height: 40px; display: inline-block; padding: 0 47px; text-shadow: none !important; text-decoration: none !important; background-color: #cccccc; color: #ffffff; font-size: 16px; height: 40px; border-radius: 5px; border-style: none;\" onclick=\"ConveadClient.WidgetTracker.handleWidgetClose(event);\">Закрыть</button></p>↵</div>",
            width: "740px"
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
