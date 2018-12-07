Request = require('../libs/request')
robotDetection = require('../libs/robot_detection.coffee')
visibility = require('../libs/visibility.coffee')
config = require('../config')

module.exports = class Pinger
  constructor: (period) ->
    @ping_period = period || 15000
    @has_focus = true

    @activity()

    window.setInterval(@ping, @ping_period)

    document.onmousedown = @clicked
    document.onmousemove = @moved
    document.onkeydown = @typed
    document.onblur = @blured
    document.onfocus = @activity

  moved: => @activity()

  typed: => @activity()

  clicked: => @activity()

  blured: =>
    @has_focus = false

  activity: =>
    @has_focus = true

  ping: =>
    return if !visibility.hasFocus() || !@has_focus

    return if robotDetection.is_bot()

    @blured()

    data =
      app_key: config.appKey
      device_uid: config.uid

    response = (response) =>
      robotDetection.detect() if response == 'Bot detected!'

    (new Request).send('//' + config.endpoint + '/ping', data, response)
