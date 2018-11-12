VisitorLossDetection = require('../libs/visitorLossDetection.coffee')
helpers = require('./helpers.coffee')
cookies = require('../libs/cookies')
domEvent = require('../libs/domEvent')
SimpleValidation = require('../libs/simpleValidation.coffee')
WidgetRenderersEmbedded = require('./renderers/embedded.coffee')
WidgetRenderersBar = require('./renderers/bar.coffee')
WidgetRenderersPopup = require('./renderers/popup.coffee')
WidgetRenderersNotice = require('./renderers/notice.coffee')

module.exports = class WidgetTracker
  constructor: (@options, widgetViewer) ->
    return unless @options.id

    @widgetViewer = widgetViewer

    @options.html ||= ''
    @options.render = false
    @options.properties ||= {}
    @options.renderTimeout = false;
    delay = (parseInt(@options.timeout) || 0)

    if @options.type == 'pop-up' && @options.visitor_loss_detect
      @options.renderLossDetection = new VisitorLossDetection(delay: delay, detect: @render_without_overlap)
    else
      if delay == 0 || @options.type == 'embedded'
        @render_without_overlap()
      else
        @options.renderTimeout = setTimeout(@render_without_overlap, delay * 1000)

  render_without_overlap: =>
    @widgetViewer.check_overlap @options, (=> @render())

  render: =>
    if !@options.render
      @renderer_view = switch @options.type
        when 'embedded'
          @options.render = new WidgetRenderersEmbedded(@, @options)
        when 'top-bar'
          @options.render = new WidgetRenderersBar(@, @options)
        when 'bottom-bar'
          @options.render = new WidgetRenderersBar(@, @options)
        when 'pop-up'
          @options.render = new WidgetRenderersPopup(@, @options)
        when 'notice'
          @options.render = new WidgetRenderersNotice(@, @options)
      @el = @renderer_view.el
      return unless @el

      workarea_el = @renderer_view.workarea_el
      @el.setAttribute('data-id', @options.id)
      workarea_el.setAttribute('data-id', @options.id)

      helpers.load_child_scripts_from_object @el
      @view() if @options.type != 'top-bar' && @options.type != 'bottom-bar'
      @options.properties.on_complete(@el) if typeof @options.properties.on_complete == 'function'
      @bind_events(workarea_el)

  bind_events: (workarea_el) ->
    domEvent.add workarea_el, 'submit', (e) =>
      e.preventDefault()
      form_data = new formToObject(workarea_el)
      @submit(form_data.properties)

    # phone mask input
    phone_fields = @el.querySelectorAll('[name="properties[phone]"]')
    for k of phone_fields
      if typeof phone_fields[k] == 'object'
      
        domEvent.add phone_fields[k], 'keypress', (event) ->
          e = event || window.event
          code = e.keyCode || e.charCode
          input_char = String.fromCharCode(code)
          if (/[^\+0-9 \(\)\-]/g).test(input_char) && [46, 8, 13, 37, 39].indexOf(code) == -1
            e.preventDefault()

        domEvent.add phone_fields[k], 'keyup', ->
          if this.value.length > 0
            selectionPosition = this.selectionStart
            this.value = this.value.replace(/(^[^0-9\+]{0,1})|[^0-9 \(\)\-]|( ){2,}|(\-){2,}|(\(){2,}|(\)){2,}/g, '')
            this.selectionStart = selectionPosition
            this.selectionEnd = selectionPosition

    all_links = @el.querySelectorAll('.cnv-widget_component a')
    
    # Exclude prohibited links
    links = []
    exclude_links = @el.querySelectorAll('.cnv-widget_component .cnv-widget_checkbox_type_agree a')
    for link in all_links
      if typeof link == 'object'
        for exclude_link in exclude_links
          if link != exclude_link
            links.push link
        links.push link if exclude_links.length == 0

    if links.length
      for link in links
        domEvent.add link, 'click', (e) =>
          e.preventDefault()
          @submit({}) unless helpers.selector_closest(link, '[data-nosubmit=true]') || link.getAttribute('data-nosubmit')
          href = e.currentTarget.getAttribute("href")
          if e.currentTarget.target && e.currentTarget.target.toLowerCase() == '_blank'
            window.open(href,'_blank')
          else
            window.location.href = href

    button_el = @el.querySelectorAll('.cnv-widget_sending_notice button')
    if button_el.length
      for button in button_el
        domEvent.add button, 'click', (e) =>
          @widgetViewer.hide({widget: @options.id})
          @close()
          e.preventDefault()

  submit: (data) =>
    properties = {
      web_form_id: @options.id
      web_form_data: data
    }
    if @submit_value || properties.submit_value
      properties.submit_value = @submit_value || properties.submit_value
    cookies.set('convead_widget_submitted_'+@options.id, @options.id, { expires: 31536000 })

    mkz('setVisitorInfo', data)
    mkz('trackWebFormSubmit', properties)

    @submit_value = ''

    @widgetViewer.render_overlapped()

  view: ->
    mkz('trackWebFormShow', {web_form_id: @options.id})

  close: =>
    cookies.set('convead_widget_closed_'+@options.id, @options.id, { expires: 86400 }) unless @options.preview_mode?

    mkz('trackWebFormClose', {web_form_id: @options.id})

    @widgetViewer.render_overlapped()

@submit_value = ''

WidgetTracker.handleWidgetButton = (event, action_str, submit_value = '') ->
  @submit_value = submit_value
  # delay 0 ms waiting for the removal of the widget from array widgetViewer.widgets
  setTimeout ->
      workarea_el = helpers.selector_closest(event.target, '.cnv-widget_workarea') || document.querySelector('.cnv-widget_workarea')
      
      validator = new SimpleValidation(workarea_el)

      # availability of email in js button
      form_data = new formToObject(workarea_el)
      if form_data.properties
        for k, val of form_data.properties
          window.ConveadSettings.visitor_info[k] = val if val

      if validator.valid()
        eval(action_str)
      else
        event.preventDefault()
    , 0

WidgetTracker.handleWidgetClose = (event) ->
  return unless event

  if event.target
    event.preventDefault()
    event.stopPropagation()
    self = event.target
  else
    self = event
    
  workarea_el = helpers.selector_closest(self, '.cnv-widget_workarea')
  if workarea_el
    id = parseInt(workarea_el.getAttribute('data-id'))
    @WidgetViewer.hide({ id: id })
