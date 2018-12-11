const config = require('../config')

module.exports = class Request {
  constructor () {
  }
  send (url, post, success, fail) {
    success = success || (() => {})
    fail = fail || (() => {})
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url, true)
    xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8')
    xhr.onreadystatechange = () => {
      if (xhr.readyState == 4 && xhr.status == 200) {
        success(JSON.parse(xhr.responseText))
      } else fail(xhr)
    }
    xhr.send(JSON.stringify(post))
  }
}
