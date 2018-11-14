config = require('../config')
SimpleLiquid = require('../libs/simpleLiquid.coffee')

module.exports = {

  replace: (html) ->
    # substitutions
    html = html.replace(/(%{|%%7B)(.*?)(}|%7D)/gi, (f1, f2, field_content, f3) => @_replacement(field_content))

    # liquid
    liquidData = {
      visitor_info: config.visitor
    }
    liquid = new SimpleLiquid(html, liquidData)
    liquid.render()

  _replacement: (field_content) ->
    return '' unless field_content
    keys = field_content.split '|'
    # set value or default value
    # example: %{first_name|my friend}
    (keys[0] && @_value(keys[0])) || keys[1] || ''

  _value: (key) ->
    config.visitor[key]

}
