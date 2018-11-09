log = require('../libs/log')
cookies = require('../libs/cookies')
contentRenderer = require('../widgets/contentRenderer.coffee')
WidgetTracker = require('../widgets/WidgetTracker.coffee')
ImagesPreloader = require('../libs/imagesPreloader.coffee')

self = {

  # Widgets ready for rendering
  widgets: {}

  # Widgets queued for display due to overlap
  widgets_overlap_ids: {}

  # Manual widgets ready for rendering
  delayed_manual_widgets_ids: {}
  
  # Manual widgets ready for rendering
  delayed_manual_widgets_slugs: {}

  # Widgets waiting to be showed after scrolling
  delayed_scroll_widgets_ids: []

  # Popups are divided into two groups.
  # Each group shows one page on the page.
  blocked_widget_groups: {
    active: false
    passive: false
  }

  track: (data) ->
    if data.post.type == 'page_view'
      self.widgets_reset()

      for k, widget of data.response.widgets
        self.add(widget)

  widgets_reset: ->
    for id of @widgets
      widget = @widgets[id]

      # Clear timeouts
      if widget.renderTimeout
        clearTimeout(widget.renderTimeout)

      # Clear loss detection
      if widget.renderLossDetection
        widget.renderLossDetection.abort()

      # Remove all widgets except those who are renderer
      if !widget.render
        delete @widgets[id]

    @widgets_overlap_ids = {}
    @delayed_scroll_widgets_ids = []
    @blocked_widget_groups = {
      active: false
      passive: false
    }

  add: (widget) ->
    @load widget.html, => 
      widget.visitor_loss_detect = false if @is_mobile()

      if widget.display_type == 'auto' && (cookies.get('convead_widget_submitted_'+widget.id) || cookies.get('convead_widget_closed_'+widget.id))
        @_log 'Has blocked cookie', widget
        return false
      console.log @widgets, widget.id, @widgets[widget.id]
      if typeof @widgets[widget.id] != 'undefined'
        @_log 'Abort double init one widget', widget
        return false
      else
        @widgets[widget.id] = widget

      if widget.scroll_top_percent && widget.scroll_top_percent > 0
        @delayed_scroll_widgets_ids.push(widget.id)
        @scroll_condition()
      else
        @other_conditions(widget)

  other_conditions: (widget) ->
      @_log 'Add widget', widget
      if widget.display_type == 'auto' && @_validate_conditions(widget) && !@_has_widget_rendered(widget.type)
        new WidgetTracker(widget, self)
      else if widget.display_type == 'manual' 
        if typeof @delayed_manual_widgets_ids[widget.id] != 'undefined'
          @show_manual @delayed_manual_widgets_ids[widget.id]
        else if typeof @delayed_manual_widgets_slugs[widget.slug] != 'undefined'
          @show_manual @delayed_manual_widgets_slugs[widget.slug]

  scroll_condition: ->
    return if @delayed_scroll_widgets_ids.length == 0

    scroll_top = @_get_scroll_top()
    doc_height = @_get_doc_h()
    scroll_percent = scroll_top / doc_height
    win_height_percent = @_get_win_h() / doc_height
    
    for k of @delayed_scroll_widgets_ids
      id = @delayed_scroll_widgets_ids[k]
      widget = @widgets[id]
      if typeof widget != 'undefined'
        top_percent = widget.scroll_top_percent / 100
        
        if scroll_percent < top_percent and top_percent < scroll_percent + win_height_percent
          @delayed_scroll_widgets_ids.splice(k, 1)
          @other_conditions( widget )
          @_log 'On scroll condition for widget', widget

  check_location_param: (option) ->
    if option instanceof window.Array
      for key, val of option
        return false if window.location.search.indexOf("&#{val}=") > -1 || window.location.search.indexOf("?#{val}=") > -1
    return true

  check_overlap: (widget, callback) ->
    return unless widget

    has_overlap = false

    # Exclude the widget with push if browser do not support
    if !@browser_support_web_push() && widget.html.indexOf('ConveadClient.WidgetPush.subscribe()') > -1
      @_log 'Exclude the widget with push if browser do not support', widget.id
      return false
    
    if widget.type == 'pop_up'

      # Check the overlap of this widget
      for r_widget_id, r_widget of @widgets
        if r_widget.type == widget.type && r_widget.render && widget.id != r_widget.id
          has_overlap = true
          break
    
      # Check blocked groups of widgets
      if widget.display_type == 'auto'
        group_name = if widget.visitor_loss_detect || widget.scroll_top_percent then 'active' else 'passive'
        if @blocked_widget_groups[group_name] == true
          delete @widgets_overlap_ids[widget.id]
          @_log "Group of widgets '#{group_name}' has already been shown", widget.id
          return false
        else
          @blocked_widget_groups[group_name] = true unless has_overlap

    # Has overlap of widgets
    if has_overlap
      @widgets_overlap_ids[widget.id] = {
        widget: widget
        callback: callback
      }
      @_log 'Occurred overlap widgets', widget.id
    
    else
      delete @widgets_overlap_ids[widget.id]
      # Render widget
      callback()

  render_overlapped: ->
    for widget_id, item of @widgets_overlap_ids
      setTimeout ->
          @check_overlap item.widget, item.callback
      , 0

  show_manual: (properties) ->
    widget = @widget_by_properties(properties)
    if widget
      delete @delayed_manual_widgets_ids[widget.id]
      delete @delayed_manual_widgets_slugs[widget.slug]
    else
      if properties.id
        @delayed_manual_widgets_ids[properties.id] = properties 
      if properties.slug
        @delayed_manual_widgets_slugs[properties.slug] = properties 

      return

    widget.properties = properties

    if widget.display_type == 'manual' && @_validate_conditions(widget) && !@_has_widget_rendered(widget.type)
      delete widget.timeout
      widget.visitor_loss_detect = false
      new WidgetTracker(widget, self)

  hide: (properties) ->
    for id of @widgets
      widget = @widgets[id]
      valid_properties = (@widget_filter(widget, properties) || (!properties.display_type && !properties.slug && !properties.id))
      if widget.render && valid_properties
        switch widget.type
          when 'top_bar'
            widget.render.hide_with_event()
          when 'bottom_bar'
            widget.render.hide_with_event()
          when 'embedded'
            widget.render.close_with_event()
          when 'pop_up'
            widget.render.close_with_event()
          when 'notice'
            widget.render.close_with_event()

  widget_by_properties: (properties) ->
    return false unless properties
    for widget_id, widget of @widgets
      return widget if @widget_filter(widget, properties)
    false

  widget_filter: (widget, properties) ->
    if (properties.id && parseInt(widget.id) == parseInt(properties.id)) || (properties.slug && widget.slug == properties.slug) || (properties.display_type && widget.display_type == properties.display_type)
      return true
    else
      return false

  load: (html, callback) ->
    html = contentRenderer.replace html
    (new ImagesPreloader()).load html, (=>
        callback()
      )

  start_hide_timer: (widget, callback) ->
    return if !widget.close_timeout || parseInt(widget.close_timeout) == 0
    @reset_hide_timer widget
    widget.close_timeout_index = setTimeout ( -> callback() ), widget.close_timeout * 1000

  reset_hide_timer: (widget) ->
    clearTimeout widget.close_timeout_index

  preview: (widget_id, variant_id, screen_width) ->
    data = {
      app_key: ConveadClient.app_key,
      widget_id: widget_id,
      variant_id: variant_id,
      screen_width: screen_width
    }

    ConveadReqwest(
      url: "#{ConveadClient.tracker_url}/widget/preview"
      type: 'json'
      method: 'post'
      data: data
      crossOrigin: true
      async: true
      success:
        (res) ->
          delete res.timeout
          res.preview_mode = true
          @_log 'Preview widget', res

          window.ConveadDefaultSettings.recommended_offers = []
          for k in [1..9]
            window.ConveadDefaultSettings.recommended_offers.push {
              name: 'Product'
              picture: 'https://d2p70fm3k6a3cb.cloudfront.net/public/messages/common/product.jpg'
              oldprice: helpers.integer_to_currency(110)
              price: helpers.integer_to_currency(100)
              url: '#'
            }
          html = contentRenderer.replace res.html

          @load html, =>
            new WidgetTracker(res, self)
            @widgets[ res.id ] = res
    )

  is_mobile: ->
    (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino|android|ipad|iphone|playbook|silk/i.test(navigator.userAgent||navigator.vendor||window.opera)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test((navigator.userAgent||navigator.vendor||window.opera).substr(0,4)))

  browser_support_web_push: ->
    !@is_safari() && ('serviceWorker' of navigator and 'PushManager' of window)

  is_safari: ->
    # if browser is safari that does not support window.safari (iphone, ipad, etc)
    /^((?!chrome|android).)*safari/i.test(navigator.userAgent) && !window.safari

  _get_win_h: ->
    window.innerHeight

  _get_doc_h: =>
    D = document
    Math.max(D.body.scrollHeight, D.documentElement.scrollHeight, D.body.offsetHeight, D.documentElement.offsetHeight, D.body.clientHeight, D.documentElement.clientHeight)

  _get_scroll_top: ->
    window.pageYOffset || document.documentElement && document.documentElement.scrollTop || document.body && document.body.scrollTop || 0

  _has_widget_rendered: (type) ->
    return false if type != 'top_bar' && type != 'bottom_bar'
    for id of @widgets
      widget = @widgets[id]
      if typeof widget.render != 'undefined' && widget.type == type
        if widget.renderTimeout == false
          @_log 'Abort double render. Widget was rendered', widget
          return widget
        else
          clearTimeout widget.renderTimeout
    false

  _validate_conditions: (widget) ->
    is_mobile = @is_mobile()
    is_valid = true
    is_valid = false unless !widget.device || (widget.device == 'desktop' && !is_mobile) || (widget.device == 'mobile' && is_mobile)
    @_log 'Validate conditions', is_valid
    is_valid

  _log: (type, object) ->
    log.push 'WidgetViewer', type, object

}

module.exports = self