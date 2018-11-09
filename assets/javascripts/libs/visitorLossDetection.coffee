module.exports = class VisitorLossDetection
  status: 'initial'
  event: ''
  cursor_offset_top: 0
  cursor_offset_top_max: 100

  constructor: (@options) ->
    @remaining_seconds = @options.delay
    if @remaining_seconds > 0 then @start_timer() else @expire()
    @bind_events()

  bind_events: ->
    self = @

    $el = document.body
    ConveadDOMEvent.add $el, 'mouseover', (e) ->
      toElement = e.relatedTarget || e.fromElement
      while toElement && toElement isnt this
        toElement = toElement.parentNode
      return if toElement == this
      # console.log 'mouseenter'

      return if self.status != 'initial'

      if self.event == 'mouseover'
        return
      else
        self.event = 'mouseover'

      self.start_timer()

    ConveadDOMEvent.add $el, 'mouseout', (e) ->
      e = e || window.event
      if typeof e.pageY == 'number'
        self.cursor_offset_top = e.pageY - document.body.scrollTop - document.documentElement.scrollTop
      else if typeof e.clientY == 'number'
        self.cursor_offset_top = e.clientY
      else
        self.cursor_offset_top = 0

      toElement = e.relatedTarget || e.toElement
      while toElement && toElement isnt this
        toElement = toElement.parentNode
      return if toElement == this
      # console.log 'mouseleave'

      return if self.status == 'detected'

      if self.event != 'mouseout' && self.cursor_offset_top < self.cursor_offset_top_max
        self.event = 'mouseout'
      else
        return
        
      if self.status == 'expired' then self.detect() else self.stop_timer()

  start_timer: ->
    return if @timer_id
    # console.log 'start'
    @timer_id = setInterval(@tick_timer, 1000)

  stop_timer: ->
    return unless @timer_id
    # console.log 'stop'
    clearInterval(@timer_id)
    @timer_id = null

  tick_timer: =>
    @remaining_seconds -= 1
    # console.log 'tick', @remaining_seconds
    if @remaining_seconds == 0
      clearInterval(@timer_id)
      @expire()

  expire: ->
    @status = 'expired'

  detect: ->
    @status = 'detected'
    @options.detect && @options.detect()

  abort: ->
    @status = 'detected'
