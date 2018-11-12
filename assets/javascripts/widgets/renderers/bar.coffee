contentRenderer = require('../contentRenderer.coffee')
helpers = require('../helpers.coffee')
domEvent = require('../../libs/domEvent')
cookies = require('../../libs/cookies')
SimpleValidation = require('../../libs/simpleValidation.coffee')

module.exports = class WidgetRenderersBar
  animation_duration: 350

  constructor: (@widget_tracker_view, @options) ->
    tmp_el = document.createElement('div')
    tmp_el.innerHTML = @template()
    @el = tmp_el.firstChild
    @box_el = tmp_el.querySelector('.mkz-widget__bar')
    @shift = tmp_el.querySelector(".mkz-widget__bar-shift")
    @content_el = @el.querySelector('.mkz-widget__bar-content')
    @hide_el = @el.querySelector('.mkz-widget__bar-hide')
    @show_el = @el.querySelector('.mkz-widget__bar-show')
    @logo = @el.querySelector('.mkz-widget__bar-logo')
    @sending_notice_el = @el.querySelector('.mkz-widget__sending-notice')
    @sending_body_el = @el.querySelector('.mkz-widget__body')

    @show_el.style.backgroundColor = @hide_el.style.backgroundColor = @options.settings['background-color'] if @options.settings['background-color']
    @show_el.style.color = @hide_el.style.color = @options.settings['action_color'] if @options.settings['action_color']

    if window.innerWidth < 1200 || window.location.search.indexOf('screen_width=640') != -1
      helpers.add_class @el, 'mkz-widget__resolution_640'

    if (@options.type == 'top-bar')
      document.body.insertBefore(@el, document.body.firstChild)
    else
      document.body.appendChild(@el)

    @workarea_el = @el.querySelector('.mkz-widget__workarea')

    @show_el_height = if @show_el then @show_el.scrollHeight else 0

    if @widget_tracker_view.options.preview_mode? || cookies.get("convead_topbar_#{@options.id}_state") != 'hide'
      @widget_tracker_view.view()
      @animate('show')
      @animate_show_el('hide', fast: true)
      @logo.style.display = 'block' unless @options.whitelabel
    else
      @animate('hide', fast: true)
      @animate_show_el('show')
      @logo.style.display = 'none' unless @options.whitelabel

    @widget_tracker_view.widgetViewer.start_hide_timer @options, (=> @hide())

    @bind_events()

  template: ->
    action_style_color = if @options.settings.action_color then 'color:' + @options.settings.action_color else false
    close_html = if @options.properties.allow_close == false then '' else "<div class='mkz-widget__bar-hide' title='Close' style='#{action_style_color}'></div><div class='mkz-widget__bar-show' title='Open' style='#{action_style_color}'></div>"
    "<div mkz class='mkz-widget mkz-widget_type_#{@options.type}'>
      <div class='mkz-widget__bar-shift'>&nbsp;</div>
      <div class='mkz-widget__bar'>
        #{@whitelabel()}
        <div class='mkz-widget__bar-content'>#{contentRenderer.replace( @options.html )}</div>
        #{close_html}
      </div>
    </div>"

  bind_events: ->
    if @options.properties.allow_close != false
      domEvent.add(@show_el, 'click', @show)
      domEvent.add(@hide_el, 'click', @hide_with_event)

    domEvent.add @workarea_el, 'submit', (e) =>
      validator = new SimpleValidation(@workarea_el)
      unless validator.valid()
        e.stopNow = true
        e.preventDefault()

    domEvent.add @workarea_el, 'submit', (e) =>
      if @options.settings.sending_notice_enable == 'true'
        @sending_notice_el.style.display = 'block'
        @sending_body_el.style.display = 'none'
      else
        @hide
          callback: => 
            @el.parentElement.removeChild(@el)
            @shift.parentElement.removeChild(@shift)
      
      unless @widget_tracker_view.options.preview_mode?
        cookies.set("convead_topbar_#{@options.id}_state", @topbar_state)

  show: (options={}) =>
    @widget_tracker_view.view()
    @animate_show_el 'hide',
      callback: => 
        @animate('show', options)
        @logo.style.display = 'block' unless @options.whitelabel

  hide_with_event: (options={}) =>
    @widget_tracker_view.close()
    @hide options
    unless @widget_tracker_view.options.preview_mode?
      cookies.set("convead_topbar_#{@options.id}_state", @topbar_state)

  hide: (options={}) =>
    return if @topbar_state == 'hide'

    @widget_tracker_view.widgetViewer.reset_hide_timer @options

    cb = options.callback
    options.callback = =>
      cb && cb()
      @animate_show_el('show')

    @animate('hide', options)
    @logo.style.display = 'none' unless @options.whitelabel

  animate: (state, animate_options={}) ->
    @topbar_state = state

    topbar_content_height = @content_el.scrollHeight
    duration = (if animate_options.fast then 1 else @animation_duration)

    start1 = -topbar_content_height; end1 = 0
    start2 = 0; end2 = topbar_content_height
    delta = 'easeOutQuad'

    if state == 'hide'
      tmp = start1; start1 = end1; end1 = tmp
      tmp = start2; start2 = end2; end2 = tmp
      delta = 'easeInQuad'

    helpers.animate_prop
      el: @box_el
      prop: (if @_is_topbar() then 'top' else 'bottom')
      start: start1
      end: end1
      duration: duration
      complete: animate_options.callback
      delta: delta

    helpers.animate_prop
      el: @shift
      prop: 'height'
      start: start2
      end: end2
      duration: duration
      delta: delta

  animate_show_el: (state, animate_options={}) ->
    start = 0; end = @show_el_height
    duration = (if animate_options.fast then 1 else @animation_duration)

    if state == 'hide'
      tmp = start; start = end; end = tmp

    if @options.properties.allow_close != false
      helpers.animate_prop
        el: @show_el
        prop: 'height'
        start: start
        end: end
        duration: duration
        complete: animate_options.callback

      helpers.animate_prop
        el: @show_el
        prop: (if @_is_topbar() then 'marginBottom' else 'marginTop')
        start: end
        end: start
        duration: duration

  whitelabel: ->
    if @options.whitelabel
      ''
    else
      helpers.landing_page_link('widget', {class: 'mkz-widget__bar-logo'})

  _is_topbar: ->
    @options.type == 'top-bar'
