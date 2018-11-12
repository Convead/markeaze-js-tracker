contentRenderer = require('../contentRenderer.coffee')
helpers = require('../helpers.coffee')
domEvent = require('../../libs/domEvent')
SimpleValidation = require('../../libs/simpleValidation.coffee')

module.exports = class WidgetRenderersEmbedded
  constructor: (@widget_tracker_view, @options) ->
    @el = document.getElementById("mzk_widget_#{@options.id}")
    if !@el
      if @widget_tracker_view.options.preview_mode?
        helpers.touch_container (el) =>
          @el = el
          @insert()      
      else
        return
    else
      @insert()

  insert: ->
    @el.innerHTML = "<div mkz class='mkz-widget mkz-widget_type_embedded'>" + contentRenderer.replace( @options.html ) + '</div>'
    @widget = @el.querySelector('.mkz-widget')
    @sending_notice_el = @el.querySelector('.mkz-widget__sending-notice')
    @sending_body_el = @el.querySelector('.mkz-widget__body')
    @workarea_el = @el.querySelector('.mkz-widget__workarea')

    for key, css_style of ['width', 'maxWidth']
      @widget.style[css_style] = @workarea_el.style[css_style] if @workarea_el.style[css_style]

    @bind_events()

  bind_events: ->
    workarea_el = @el.querySelector('.mkz-widget__workarea')

    domEvent.add workarea_el, 'submit', (e) ->
      validator = new SimpleValidation(workarea_el)
      unless validator.valid()
        e.stopNow = true
        e.preventDefault()

    domEvent.add workarea_el, 'submit', (e) =>
      if @options.settings.sending_notice_enable == 'true'
        @sending_notice_el.style.display = 'block'
        @sending_body_el.style.display = 'none'
      else
        # delay 0 ms for waiting function WidgetTracker.handleWidgetButton()
        setTimeout ->
            workarea_el.reset()
          , 0

    domEvent.add window, 'resize', @resize_window
    @resize_window()

  resize_window: =>
    response_class = 'mkz-widget_response_yes'
    helpers.remove_class(@widget, response_class)
    @widget_width_initial = Math.floor(@widget.clientWidth) unless @widget_width_initial
    helpers.add_class(@widget, response_class) if helpers.window_width() < @widget_width_initial + @el.offsetLeft

  close_with_event: () =>
    @el.parentElement.removeChild(@el)
    @widget_tracker_view.close()
