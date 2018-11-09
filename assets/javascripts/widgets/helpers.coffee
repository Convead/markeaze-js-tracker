Animation = require('../libs/animation.coffee')

module.exports = {
  window_width: ->
    res = 0
    if typeof window.innerWidth == 'number'
      res = window.innerWidth
    else if document.documentElement && document.documentElement.clientWidth
      res = document.documentElement.clientWidth
    else if document.body && document.body.clientWidth
      res = document.body.clientWidth
    Math.floor(res)

  window_height: ->
    res = 0
    if typeof window.innerHeight == 'number'
      res = window.innerHeight
    else if document.documentElement && document.documentElement.clientHeight
      res = document.documentElement.clientHeight
    else if document.body && document.body.clientHeight
      res = document.body.clientHeight
    Math.floor(res)

  outer_width: (el) ->
    width = el.offsetWidth
    width += parseInt(el.style.marginLeft) if el.style.marginLeft
    width += parseInt(el.style.marginRight) if el.style.marginRight
    Math.floor(width)

  remove_class: (el, className) ->
    if (el.classList)
      el.classList.remove(className)
    else
      el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ')

  add_class: (el, className) ->
    if (el.classList)
      el.classList.add(className)
    else
      el.className += ' ' + className

  animate: (options) ->
    new Animation(options)

  animate_prop: (options) ->
    options.dimension = 'px' if typeof options.dimension == 'undefined'
    if typeof options.cssFunction != 'undefined'
      options.prefix = '('
      options.postfix = ')'
    else
      options.cssFunction = ''
      options.prefix = ''
      options.postfix = ''
    options.step = (delta) ->
      per = options.end - options.start
      value = options.start + (Math.round(per * delta * 100) / 100)
      options.el.style[options.prop] = "#{options.cssFunction}#{options.prefix}#{value}#{options.dimension}#{options.postfix}"

    new Animation(options)

  selector_closest: (element, selector) ->
    return unless element
    closest = (element, selector) ->
      matchesSelector = element.matches || element.webkitMatchesSelector || element.mozMatchesSelector || element.msMatchesSelector || element.oMatchesSelector
      while (element)
        break if matchesSelector.bind(element)(selector)
        element = element.parentElement
      element
    (element.closest && element.closest(selector)) || closest(element, selector)

  load_child_scripts_from_object: (object, callback = ->) ->
    scripts = object.querySelectorAll('script')
    scripts_array = []
    for script in scripts
      if src = script.src
        scripts_array.push ['upload', src]
      else
        scripts_array.push ['eval', script.innerHTML]

    upload_step = (index) ->
      if row = scripts_array[index]
        if row[0] == 'eval'
          eval(row[1])
          upload_step(index+1)
        if row[0] == 'upload'
          Sid.js row[1], (-> 
              callback(row[1])
              upload_step(index+1)
            )
    upload_step(0)

  landing_page_link: (utm_medium, attrs = {}, html) ->
    unless html
      html = 'Markeaze'
    
    attr_str = ' target="blank"'
    if typeof attrs == 'object'
      for attr, val of attrs
        attr_str += " #{attr}=\"#{val}\""
    
    "<a href='https://markeaze.com'#{attr_str}>#{html}</a>"

}
