import domEvent from './domEvent'

export default class Request {
  constructor () {}
  send (url, post, success, fail) {
    success = success || (() => {})
    fail = fail || (() => {})
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url, true)
    xhr.setRequestHeader('Accept', 'application/json, text/javascript')
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
    domEvent.add(xhr, 'readystatechange', () => {
      if (xhr.readyState === 4 && xhr.status === 200) {
        success(JSON.parse(xhr.responseText))
      }
    })
    domEvent.add(xhr, 'error', () => fail(xhr))
    xhr.send(this.toQueryString({data: JSON.stringify(post)}))
  }
  isArray () {
    typeof Array.isArray == 'function' ? Array.isArray : function (a) { return a instanceof Array }
  }
  toQueryString (o, trad) {
    var prefix, i, traditional = trad || false, s = [], enc = encodeURIComponent
    var add = function (key, value) {
          value = ('function' === typeof value) ? value() : (value == null ? '' : value)
          s[s.length] = enc(key) + '=' + enc(value)
        }
    if (this.isArray(o)) {
      for (i = 0; o && i < o.length; i++) add(o[i]['name'], o[i]['value'])
    } else {
      for (prefix in o) {
        if (o.hasOwnProperty(prefix)) this.buildParams(prefix, o[prefix], traditional, add)
      }
    }
    return s.join('&').replace(/%20/g, '+')
  }
  buildParams(prefix, obj, traditional, add) {
    var name, i, v, rbracket = /\[\]$/

    if (this.isArray(obj)) {
      for (i = 0; obj && i < obj.length; i++) {
        v = obj[i]
        if (traditional || rbracket.test(prefix)) {
          add(prefix, v)
        } else {
          this.buildParams(prefix + '[' + (typeof v === 'object' ? i : '') + ']', v, traditional, add)
        }
      }
    } else if (obj && obj.toString() === '[object Object]') {
      for (name in obj) {
        this.buildParams(prefix + '[' + name + ']', obj[name], traditional, add)
      }

    } else {
      add(prefix, obj)
    }
  }
}
