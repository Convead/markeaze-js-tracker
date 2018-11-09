contentRenderer = require('../contentRenderer.coffee')
helpers = require('../helpers.coffee')
domEvent = require('../../libs/domEvent')
SimpleValidation = require('../../libs/simpleValidation.coffee')

module.exports = class WidgetRenderersPopup
  constructor: (@widget_tracker_view, @options) ->
    tmp_el = document.createElement('div')
    tmp_el.innerHTML = @template()
    @el = tmp_el.firstChild
    @box_el = @el.querySelector('.mkz-widget__popup-box')
    @backdrop_el = @el.querySelector('.mkz-widget__popup-backdrop')
    @content_el = @el.querySelector('.mkz-widget__popup-content')
    @close_el = @el.querySelector('.mkz-widget__popup-close')
    @sending_notice_el = @el.querySelector('.mkz-widget__sending-notice')
    @sending_body_el = @el.querySelector('.mkz-widget__body')
    @workarea_el = @el.querySelector('.mkz-widget__workarea')
    
    for key, css_style of ['width', 'maxWidth']
      @content_el.style[css_style] = @workarea_el.style[css_style] if @workarea_el.style[css_style]
    
    document.body.appendChild(@el)
    @box_el.style.visibility = 'hidden'
    @box_el.style.opacity = 0
    @resize_window()

    helpers.animate_prop
      el:  @box_el
      prop: 'margin-top'
      start: 50
      end: 0
      duration: 300
      delta: 'easeOutQuad'

    helpers.animate_prop
      el:  @box_el
      prop: 'opacity'
      start: 0
      end: 1
      duration: 300
      dimension: ''
      delta: 'easeInQuad'

    @widget_tracker_view.widgetViewer.start_hide_timer @options, (=> @close())

    @bind_events()

  template: ->
    action_style_color = if @options.settings.action_color then 'color:' + @options.settings.action_color else false
    close_html = if @options.properties.allow_close == false then '' else "<div class='mkz-widget__popup-close' title='Close' style='#{action_style_color}'></div>"
    "<div mkz class='mkz-widget mkz-widget_type_pop-up'>
      <div class='mkz-widget__popup-backdrop'></div>
      <div class='mkz-widget__popup-box'>
        <div class='mkz-widget__popup-content'>
          #{contentRenderer.replace( @options.html )}
          #{close_html}
          #{@whitelabel()}
        </div>
      </div>
    </div>"

  bind_events: ->
    domEvent.add window, 'resize', @resize_window
    @resize_window()
    
    if @options.properties.allow_close != false
      domEvent.add @close_el, 'click', (=>
          @close({callback: => @widget_tracker_view.close() })
        ) 

    workarea_el = @el.querySelector('.mkz-widget__workarea')

    domEvent.add workarea_el, 'submit', (e) ->
      validator = new SimpleValidation(workarea_el)
      unless validator.valid()
        e.stopNow = true
        e.preventDefault()

    domEvent.add workarea_el, 'submit', (=>
        if @options.settings.sending_notice_enable == 'true'
          @sending_notice_el.style.display = 'block'
          @sending_body_el.style.display = 'none'
        else
          @close()
      )

  resize_window: =>
    box_height = @box_el.scrollHeight
    window_height = helpers.window_height()
    new_backdrop_height = (if box_height < window_height then window_height else box_height)
    @backdrop_el.style.height = "#{new_backdrop_height}px"

    new_box_top = if box_height < window_height then (window_height - box_height) / 2 else 0
    @box_el.style.top = "#{new_box_top}px"
    @box_el.style.visibility = 'visible'

    response_class = 'mkz-widget_response_yes'
    helpers.remove_class(@el, response_class)
    @widget_width_initial = Math.floor(@workarea_el.clientWidth) unless @widget_width_initial
    helpers.add_class(@el, response_class) if helpers.window_width() < @widget_width_initial

  close_with_event: () =>
    @close({callback: => @widget_tracker_view.close() })

  close: (options={}) =>
    delete @options.render
    
    @widget_tracker_view.widgetViewer.reset_hide_timer @options

    helpers.animate_prop
      el:  @box_el
      prop: 'margin-top'
      start: 0
      end: 50
      duration: 300
      delta: 'easeOutQuad'

    helpers.animate_prop
      el:  @box_el
      prop: 'opacity'
      start: 1
      end: 0
      duration: 300
      dimension: ''
      delta: 'easeInQuad'
      complete: =>
        @el.parentElement.removeChild(@el)
        options.callback() if options.callback

  whitelabel: ->
    if @options.whitelabel
      ''
    else
      helpers.landing_page_link('widget', {class: 'mkz-widget__popup-logo'})
