let eEmit = require('./libs/eEmit')
let cookies = require('./libs/cookies')
let uuid = require('./libs/uuid')
let domEvent = require('./libs/domEvent')
let log = require('./libs/log')
let parseUrlParams = require('./libs/parseUrlParams')
let baseDomain = require('./libs/baseDomain.coffee')
let tracker = require('./tracker')
let config = require('./config')
let css = require('./css')
let widgetViewer = require('./widgets/widgetViewer.coffee')
const Pinger = require('./libs/pinger.coffee')
const robotDetection = require('./libs/robot_detection.coffee')

module.exports = {
  eventSubscribe (key, fn) {
    eEmit.subscribe(key, fn)
  },
  pendingTasks: [],
  ready (nameVariable) {
    // abort if object is undefined
    if (!window[nameVariable]) return false

    // abort if bot detected
    if (robotDetection.is_bot()) return false

    new Pinger()

    let queue = window[nameVariable].q || []
    let self = this
    window[nameVariable] = function() {
      return self.pendingSend.apply(self, arguments)
    }

    // widgets
    css.embed(nameVariable)
    widgetViewer.bind(nameVariable)

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
        const domain = (new baseDomain())
        config.uid = config.uid || cookies.get(config.cookieUid) || uuid.get(16)
        cookies.set(config.cookieUid, config.uid, { expires: 31536000, domain: domain.get() })
        // call pending task
        for (let fields of this.pendingTasks) {
          this.send.apply(this, fields)
        }
        this.pendingTasks = []
        // track change url
        this.changeUrl()
        domEvent.add(window, 'pushState', () => { this.changeUrl() })
        domEvent.add(window, 'replaceState', () => { this.changeUrl() })
        domEvent.add(window, 'hashchange', () => { this.changeUrl() })
      }
    },
    trackPageView () {
      const properties = arguments[1] || {}
      properties.page = properties.page || {}
      properties.page.url = properties.page.url || window.location.href
      properties.page.title = properties.page.title || document.title
      properties.page.referrer = properties.page.referrer || document.referrer
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
    demoResponse () {
      config.demoResponse = arguments[1]
    },
    setVisitorInfo () {
      let info = arguments[1]
      for (let key in info) config.visitor[key] = info[key]
    },
    getVisitorInfo () {
      return config.visitor
    },
    subscribe () {
      eEmit.subscribe(arguments[1], arguments[2])
    }
  },
  pendingSend () {
    log.push('action', arguments)
    // request to plugin
    if (!config.appKey && arguments[0] != 'appKey' && arguments[0] != 'debug' && typeof arguments[0] != 'function') {
      return this.pendingTasks.push(arguments)
    }
    // apply task
    else {
      return this.send.apply(this, arguments)
    }
  },
  send () {
    let obj = arguments[0]
    // function run when the client is ready
    if (typeof obj == 'function') {
      return obj.apply(this)
    }
    else {
      // request to plugin
      if (this.plugins[ obj ]) {
        return this.plugins[ obj ].apply(this, arguments)
      }
      // custom event
      else if (arguments[0].indexOf('track') == 0) {
        return this.track(obj, arguments[1], arguments[2])
      }
    }
  },
  track (eventName, properies, callback) {
    return tracker.send(eventName, properies, callback)
  },
  changeUrl () {
    eEmit.emit('url.change', window.location.href)
  }
}
