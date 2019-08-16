const Animation = require('./libs/animation.coffee')

module.exports = {
  removeClass (el, className) {
    if (el.classList) el.classList.remove(className)
    else {
      el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ')
    }
  },
  addClass (el, className) {
    if (el.classList) el.classList.add(className)
    else el.className += ' ' + className
  },
  appendHTML (elWrap, html) {
    const tmp_el = document.createElement('div')
    tmp_el.innerHTML = html
    const el = tmp_el.firstChild
    elWrap.appendChild(el)
    return el
  },
  objectToStyles (objects) {
    const styles = []
    for (const name in objects) styles.push(`${name}: ${objects[name]}`)
    return styles.join(';')
  },
  animate (options) {
    if (typeof options.dimension === 'undefined') options.dimension = 'px'
    if (options.cssFunction) {
      options.prefix = '('
      options.postfix = ')'
    } else {
      options.cssFunction = ''
      options.prefix = ''
      options.postfix = ''
    }
    options.step = function (delta) {
      const per = options.end - options.start
      const value = options.start + (Math.round(per * delta * 100) / 100)
      options.el.style[options.prop] = `${options.cssFunction}${options.prefix}${value}${options.dimension}${options.postfix}`
    }
    return new Animation(options)
  }
}
