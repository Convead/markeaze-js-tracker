let cssRaw = require('raw-loader!sass-loader!../stylesheets/app.sass')

module.exports = {
  embed () {
    const style = document.createElement('style')
    style.appendChild(document.createTextNode(cssRaw))
    document.head.appendChild(style)
  }
}
