let eEmit = require('./libs/eEmit')
let cookies = require('./libs/cookies')
let uuid = require('./libs/uuid')
let domEvent = require('./libs/domEvent')
let log = require('./libs/log')
let parseUrlParams = require('./libs/parseUrlParams')
let tracker = require('./tracker')
let config = require('./config')
let css = require('./css')

module.exports = {
  eventSubscribe (name, fn) {
    eEmit.subscribe(name, fn)
  },
  pendingTasks: [],
  ready (name) {
    // abort if object is undefined
    if (!window[name]) return false

    css.embed()

    let queue = window[name].q || []
    let self = this
    window[name] = function() {
      self.pendingSend.apply(self, arguments)
    }
    for (let fields of queue) {
      this.pendingSend.apply(this, fields)
    }
  },
  plugins: {
    endpoint() {
      if (arguments[1]) {
        config.endpoint = arguments[1]
      }
    },
    appKey () {
      if (arguments[1]) {
        config.appKey = arguments[1]
        // set uid cookie
        config.uid = config.uid || cookies.get(config.cookieUid) || uuid.get(16)
        cookies.set(config.cookieUid, config.uid, { expires: 31536000 })
        // call pending task
        for (let fields of this.pendingTasks) {
          this.send.apply(this, fields)
        }
        this.pendingTasks = []
        // track page view
        this.changeUrl()
        domEvent.add(window, 'pushState', () => { this.changeUrl() })
        domEvent.add(window, 'replaceState', () => { this.changeUrl() })
        domEvent.add(window, 'hashchange', () => { this.changeUrl() })
      }
    },
    trackPageView () {
      const properties = arguments[1] || {}
      properties.page = properties.page || {}
      properties.page.url = window.location.href
      properties.page.title = document.title
      properties.page.referrer = document.referrer
      this.track(arguments[0], properties)
    },
    trackVisitorUpdate () {
      this.plugins.setVisitorInfo(null, arguments[1])
      this.track(arguments[0], {})
    },
    trackCustom () {
      if (typeof arguments[1] === 'string') {
        this.track(arguments[1], {}, {}, arguments[2], arguments[3])
      }
    },
    debug () {
      config.debugMode = arguments[1]
    },
    setVisitorInfo () {
      let info = arguments[1]
      for (let key in info) config.visitor[key] = info[key]
    }
  },
  pendingSend () {
    log.push('action', arguments)
    // request to plugin
    if (!config.appKey && arguments[0] != 'appKey' && arguments[0] != 'debug' && typeof arguments[0] != 'function') {
      this.pendingTasks.push(arguments)
    }
    // apply task
    else {
      this.send.apply(this, arguments)
    }
  },
  send () {
    let obj = arguments[0]
    // function run when the client is ready
    if (typeof obj == 'function') {
      obj.apply(this)
    }
    else {
      // request to plugin
      if (this.plugins[ obj ]) {
        this.plugins[ obj ].apply(this, arguments)
      }
      // custom event
      else if (arguments[0].indexOf('track') == 0) {
        this.track(obj, arguments[1], arguments[2])
      }
    }
  },
  track (eventName, properies, callback) {
    tracker.send(eventName, properies, callback)
  },
  changeUrl () {
    this.send('trackPageView')
  }
}
