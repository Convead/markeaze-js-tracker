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
          type: "top-bar",
          close_timeout: 0,
          html: '<form class="mkz-widget__workarea" style="color: #363636;min-height: 70px;padding-top: 0px;border-color: #e0e0e0;border-style: solid;border-width: 1px;padding-left: 0px;padding-right: 0px;padding-bottom: 0px;background-color: #ffffff;background-repeat: no-repeat;" novalidate="true"><div class="mkz-widget__containers mkz-widget___containers_padding_0 mkz-widget__sending-notice"><p> </p><p><span style="font-size: 16pt;">Спасибо! Ваш запрос успешно отправлен!</span></p></div><div class="mkz-widget__containers mkz-widget___containers_padding_0 mkz-widget_body"><div class="mkz-widget__container mkz-widget__container_type_img"><div class="mkz-widget__component"><div style="text-align: left;"><img alt="" src="https://d2p70fm3k6a3cb.cloudfront.net/public/widgets/predefined/discount_3.png" style="width: 175px;height: 68px;"></div></div></div><div class="mkz-widget__container mkz-widget__container_type_text"><div class="mkz-widget__component"><div style="margin-top: 20px;"><p><span style="font-size: 17px;" data-mce-style="font-size: 17px;">Летний беспредел <span style="font-size: 18pt;" data-mce-style="font-size: 18pt;"><a style="color: #cd2929;" href="https://convead.ru" data-mce-href="https://convead.ru" data-mce-style="color: #cd2929;">скидки до 30%</a></span> на все футболки</span></p></div></div></div></div></form>',
          scroll_top_percent: 0,
          settings: {
            width: "500px",
            'min-height': "70px",
            placement: "top-left",
            action_color: "#9a9a9a",
            'color': "#333",
            'background-color': "#eee",
            sending_notice_enable: "true",
            sending_notice_html: "<div style=\"text-align: center; padding: 60px 0;\"><p><span style=\"font-size: 18pt; line-height: 120%;\" id=\"mkz-win\"><span style=\"font-size: 18pt;\"><img src=\"https://d2p70fm3k6a3cb.cloudfront.net/public/widgets/predefined/wheel_of_fortune_win.png\" alt=\"\" style=\"display: inline-block;width: 100px; height: 100px;\" /><br /><br />О да! Это Ваш день!</span><br /><span style=\"font-size: 18pt;\">Проверьте почту, туда уже летит промокод.</span></span> <span style=\"font-size: 18pt; line-height: 120%;\" id=\"mkz-lose\"> <br /><img src=\"https://d2p70fm3k6a3cb.cloudfront.net/public/widgets/predefined/wheel_of_fortune_loose.png\" alt=\"\" style=\"display: inline-block;width: 80px; height: 80px;\" /><br /><br />Не расстраивайтесь!<br />Сегодня не повезло.</span></p><p style=\"margin: 40px 0;\"><button style=\"outline: 0; line-height: 40px; display: inline-block; padding: 0 47px; text-shadow: none !important; text-decoration: none !important; background-color: #cccccc; color: #ffffff; font-size: 16px; height: 40px; border-radius: 5px; border-style: none;\" onclick=\"ConveadClient.WidgetTracker.handleWidgetClose(event);\">Закрыть</button></p></div>",
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
