contentRenderer = require('../contentRenderer.coffee')
helpers = require('../helpers.coffee')
domEvent = require('../../libs/domEvent')
cookies = require('../../libs/cookies')
SimpleValidation = require('../../libs/simpleValidation.coffee')

module.exports = class WidgetRenderersNotice
  constructor: (@widget_tracker_view, @options) ->
    tmp_el = document.createElement('div')
    tmp_el.innerHTML = @template()
    @el = tmp_el.firstChild
    @box_el = @el.querySelector('.mkz-widget__box')
    @content_el = @el.querySelector('.mkz-widget__content')
    @close_el = @el.querySelector('.mkz-widget__notice-close')
    @sending_notice_el = @el.querySelector('.mkz-widget__sending-notice')
    @sending_body_el = @el.querySelector('.mkz-widget__body')
    @workarea_el = @el.querySelector('.mkz-widget__workarea')

    for key, css_style of ['width', 'maxWidth']
      @content_el.style[css_style] = @workarea_el.style[css_style] if @workarea_el.style[css_style]
    
    document.body.appendChild(@el)

    @box_el.style.visibility = 'visible'
    @box_el.style.opacity = 0

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
    close_html = if @options.properties.allow_close == false then '' else "<div class='mkz-widget__notice-close' title='Close' style='#{action_style_color}'></div>"
    "<div mkz>
      <div class='mkz-widget mkz-widget_type_notice mkz-widget_placement_#{@options.settings.placement}'>
        <div class='mkz-widget__box'>
          <div class='mkz-widget__content'>
            #{contentRenderer.replace( @options.body_html )}
            #{close_html}
            #{@whitelabel()}
          </div>
        </div>
      </div>
    </div>"

  bind_events: ->
    if @options.properties.allow_close != false
      domEvent.add @close_el, 'click', (=>
          cookies.set('mkz_widget_closed_'+@options.id, @options.id, { expires: 86400 }) unless @widget_tracker_view.options.preview_mode?
          @close({callback: => @widget_tracker_view.close() })
        )

    domEvent.add window, 'resize', @resize_window
    @resize_window()

    workarea_el = @el.querySelector('.mkz-widget__workarea')

    domEvent.add workarea_el, 'submit', (e) ->
      validator = new SimpleValidation(workarea_el)
      unless validator.valid()
        e.stopNow = true
        e.preventDefault()

    domEvent.add workarea_el, 'submit', (=>
        if @options.settings.sending_notice_enable == 'true'
          @sending_notice_el.style.display = 'block' if @sending_notice_el
          @sending_body_el.style.display = 'none' if @sending_body_el
        else
          @close()
      )

  resize_window: =>
    response_class = 'mkz-widget_response_yes'
    helpers.remove_class(@el, response_class)
    @widget_width_initial = Math.floor(helpers.outer_width(@el)) unless @widget_width_initial
    helpers.add_class(@el, response_class) if helpers.window_width() < @widget_width_initial

  close_with_event: () =>
    @close({callback: => @widget_tracker_view.close() })

  close: (options={}) =>
    delete @options.render
    
    @widget_tracker_view.widgetViewer.reset_hide_timer @options

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
        document.body.style.overflow = 'visible'
        options.callback() if options.callback

  whitelabel: ->
    if @options.whitelabel
      ''
    else
      helpers.landing_page_link('widget', {class: 'mkz-widget__popup-logo'})
