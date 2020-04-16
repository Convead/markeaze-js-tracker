import Request from '../libs/request'
import store from '../store'
import robotDetection from '../libs/robot_detection.coffee'
import visibility from '../libs/visibility.coffee'

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

    return if store.trackEnabled != true

    @blured()

    (new Request).send(
      'https://' + store.trackerEndpoint + '/ping'
      {
        app_key: store.appKey
        device_uid: store.uid
      }
      =>
      (xhr) =>
        robotDetection.detect() if xhr.status == 403 || xhr.status == 0
    )
