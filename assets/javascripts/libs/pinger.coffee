Request = require('../libs/request')
robotDetection = require('../libs/robot_detection.coffee')
visibility = require('../libs/visibility.coffee')
config = require('../config')

module.exports = class Pinger
  constructor: (period, sleep_timeout) ->
    # Period to ping, in seconds
    @ping_period = period || 15
    @sleep_timeout = sleep_timeout || 300
    @count = 0
    @last_focus_at = new Date()
    @has_focus = true

    # console.log "Set ping period #{@ping_period}"

    this.activity()

    @intervalId = window.setInterval(@nextTick, 1000)

    document.onmousedown = this.clicked
    document.onmousemove = this.moved
    document.onkeydown = this.typed
    document.onblur = this.blured
    document.onfocus = this.focused

  moved: => this.activity()

  typed: => this.activity()

  clicked: => this.activity()

  blured: =>
    @has_focus = false
    #@last_focus_at = new Date()

  focused: =>
    @last_focus_at = new Date()
    @has_focus = true
    @check_focus()

  activity: =>
    @last_activity_at = new Date()
    @has_focus = true
    @check_focus()
    @count = @count % @ping_period if @count > @ping_period

  check_focus: ->
    @last_focus_at = new Date() if visibility.hasFocus()

  data: ->
    idle_timeout: @idle_timeout()
    has_focus: visibility.hasFocus()
    _has_focus: @has_focus
    focus_timeout: @focus_timeout()

  url: ->
    '//' + config.endpoint + '/ping'

  idle_timeout: ->
    now = new Date()
    now - @last_activity_at

  focus_timeout: ->
    now = new Date()
    if visibility.hasFocus() then 0 else now - @last_focus_at

  nextTick: =>
    @count += 1
    @check_focus()
    @ping() if @count == 1 || @count <= 2 * @sleep_timeout && @count % @ping_period == 0

  ping: =>
    return if robotDetection.is_bot()

    data =
      app_key: config.appKey
      device_uid: config.uid

    response = (response) =>
      robotDetection.detect() if response == 'Bot detected!'

    (new Request).send(@url(), data, response)
