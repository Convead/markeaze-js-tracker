module.exports = 
  html5VisApi: ->
    for prefix in ['', 'webkit', 'moz', 'ms']
      _prop = if prefix.length > 0 then "#{prefix}Hidden" else 'hidden'
      if typeof document[_prop] != "undefined"
        return -> document[_prop]

  focus: ->
    if typeof document.hasFocus == 'function'
      return -> !document.hasFocus()

  hidden: ->
    if typeof (method = @html5VisApi()) == 'function'
      method
    else if typeof (method = @focus()) == 'function'
      method
    else
      -> false

  hasFocus: ->
    !@hidden()
