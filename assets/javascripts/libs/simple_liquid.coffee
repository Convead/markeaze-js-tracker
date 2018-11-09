module.exports = class SimpleLiquid

  constructor: (html, data) ->
    @html = html
    @data = data

  render: ->
    @operators @html, @data

  operators: (html, data) ->
    # Emulation of operator FOR in liquid
    html = @for(html, data)
    # Emulation of operator IF in liquid
    html = @if(html, data)
    # Emulation of variable substitution in liquid
    html = @variable(html, data)

  # EXAMPLES:
  # {% for item in items %} each {% endfor %}
  for: (html, data) ->
    re = new RegExp('\\{%[ ]*for ([^ ]*) in ([^ ]*)[ ]*%\\}([\\s\\S]*)\\{%[ ]*endfor[ ]*%\\}', 'gmi')
    html.replace(re, (content, elementName, arrayName, html) =>
      if typeof arrayName == 'string' && typeof data[arrayName] != 'undefined' && Array.isArray(data[arrayName])
        htmlArr = []
        lendth = data[arrayName].length
        for value, k in data[arrayName]
          k0 = k + 1
          newData = {
            forloop: {
              length: lendth
              first: k == 0
              last: lendth == k0
              rindex: lendth - k
              rindex0: lendth - k0
              index: k0
              index0: k
            }
          }
          newData[elementName] = value
          htmlArr.push @operators(html, newData)
        htmlArr.join('')
      else
        ''
    )

  # EXAMPLES:
  # {{ variable }}
  # {{ false }}
  # {{ 3 > variable }}
  # %7B%7B%20variable%20%7D%7D
  variable: (html, data) ->
    re = new RegExp('\\{\\{[ ]*?([^ ]*?)[ ]*?\\}\\}', 'gmi')
    html = html.replace(re, (content, objectName) =>
      @parseVariable(objectName, data)
    )
    # fix for html attr was parsed of nokogiri
    re = new RegExp('%7B%7B%20([^ ]*?)%20%7D%7D', 'gmi')
    html = html.replace(re, (content, objectName) =>
      @parseVariable(objectName, data)
    )

  # EXAMPLES:
  # {% if variable == null %} then {% endif %}
  # {% if false %} then {% endif %}
  if: (html, data) ->
    re = new RegExp('\\{%[ ]*if ([^}]*)[ ]*%\\}([\\s\\S]*?)\\{%[ ]*endif[ ]*%\\}', 'gmi')
    html.replace(re, (content, condition, htmlThen) =>
      parts = condition.split(' ')
      bool = false
      bool = @parseVariable(parts[0], data) if parts.length == 0
      if parts.length >= 3
        partFirst = @parseVariable(parts[0], data)
        partLast = @parseVariable(parts[2], data)
        operator = @decodeHTMLEntities( parts[1] )
        bool = eval("#{partFirst}#{operator}#{partLast}")
      if bool then htmlThen else ''
    )

  parseVariable: (objectName, data) ->
    variables = objectName.split('.')
    if variables.length == 1
      variable = variables[0]
      # is integer 
      return variable if /^\+?(0|[1-9]\d*)$/.test(variable)
      # is string 
      return variable.replace(/[\"\']/g, '') if /^[\"\'](.+)[\"\']$/.test(variable)
      # other
      return false if variable == 'false'
      return true if variable == 'true'
      return undefined if variable == 'undefined'
      return null if variable == 'null'
      return NaN if variable == 'NaN'
    objectData = data
    for value, k in variables
      return undefined if typeof objectData[value] == 'undefined'
      objectData = objectData[value]
    objectData

  decodeHTMLEntities: (text) ->
    entities = [
      ['amp', '&']
      ['apos', '\'']
      ['#x27', '\'']
      ['#x2F', '/']
      ['#39', '\'']
      ['#47', '/']
      ['lt', '<']
      ['gt', '>']
      ['nbsp', ' ']
      ['quot', '"']
    ]
    for val, k in entities
      text = text.replace(new RegExp('&'+val[0]+';', 'g'), val[1])
    text
