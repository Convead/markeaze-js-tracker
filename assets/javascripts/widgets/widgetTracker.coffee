VisitorLossDetection = require('../libs/visitorLossDetection.coffee')
helpers = require('./helpers.coffee')
domEvent = require('../libs/domEvent')
formToObject = require('../libs/formToObject')
WidgetRenderersEmbedded = require('./renderers/embedded.coffee')
WidgetRenderersBar = require('./renderers/bar.coffee')
WidgetRenderersPopup = require('./renderers/popup.coffee')
WidgetRenderersNotice = require('./renderers/notice.coffee')

module.exports = class WidgetTracker
  constructor: (@options, widgetViewer) ->
    return unless @options.id

    @widgetViewer = widgetViewer

    @options.body_html ||= ''
    @options.render = false
    @options.properties ||= {}
    @options.renderTimeout = false;
    delay = (parseInt(@options.after_page_timeout) || 0)

    if @options.display_type == 'pop-up' && @options.on_exit
      @options.renderLossDetection = new VisitorLossDetection(delay: delay, detect: @render_without_overlap)
    else
      if delay == 0 || @options.display_type == 'embedded'
        @render_without_overlap()
      else
        @options.renderTimeout = setTimeout(@render_without_overlap, delay * 1000)

  render_without_overlap: =>
    @widgetViewer.check_overlap @options, (=> @render())

  render: =>
    if !@options.render
      @renderer_view = switch @options.display_type
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
      return unless @renderer_view
      @el = @renderer_view.el
      return unless @el

      workarea_el = @renderer_view.workarea_el
      @el.setAttribute('data-id', @options.id)
      workarea_el.setAttribute('data-id', @options.id)

      helpers.load_child_scripts_from_object @el
      @view() if @options.display_type != 'top-bar' && @options.display_type != 'bottom-bar'
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

    all_links = @el.querySelectorAll('.mkz-widget__component a')
    
    # Exclude prohibited links
    links = []
    exclude_links = @el.querySelectorAll('.mkz-widget__component .mkz-widget__checkbox_type_agree a')
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
          href = e.currentTarget.getAttribute('href')
          @link(href) unless helpers.selector_closest(link, '[data-nosubmit=true]') || link.getAttribute('data-nosubmit')
          if e.currentTarget.target && e.currentTarget.target.toLowerCase() == '_blank'
            window.open(href,'_blank')
          else
            window.location.href = href

    button_el = @el.querySelectorAll('.mkz-widget__sending-notice button')
    if button_el.length
      for button in button_el
        domEvent.add button, 'click', (e) =>
          @widgetViewer.hide({widget: @options.id})
          @close()
          e.preventDefault()

  submit: (data) =>
    # sending is performed earlier than installing VisitorInfo to ensure that this data does not fall into the event
    window.mkz('trackWebFormSubmit', {
      web_form_id: @options.id
      web_form_data: data
      page: @properiesPage()
    })
    window.mkz('setVisitorInfo', data)

    @widgetViewer.render_overlapped()

  view: ->
    mkz('trackWebFormShow', {
      web_form_id: @options.id
      page: @properiesPage()
    })

  click: (link) ->
    mkz('trackWebFormClick', {
      web_form_id: @options.id
      action_type: 'open_link',
      link_url: link,
      page: @properiesPage()
    })

  close: =>
    mkz('trackWebFormClose', {
      web_form_id: @options.id
      page: @properiesPage()
    })

    @widgetViewer.render_overlapped()

  properiesPage: () =>
    page = {
      url: window.location.href
      title: document.title
    }
    page.referrer = document.referrer if document.referrer
    page
