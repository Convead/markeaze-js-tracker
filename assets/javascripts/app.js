const eEmit = require('./libs/eEmit')
const cookies = require('./libs/cookies')
const uuid = require('./libs/uuid')
const log = require('./libs/log')
const parseUrlParams = require('./libs/parseUrlParams')
const baseDomain = require('./libs/baseDomain.coffee')
const tracker = require('./tracker')
const webFormsViewer = require('./webForms/viewer')
const Pinger = require('./libs/pinger.coffee')
const robotDetection = require('./libs/robot_detection.coffee')
const helpers = require('./helpers')
const airbrake = require('./libs/airbrake')
const domEvent = require('./libs/domEvent')
const Request = require('./libs/request')
const Liquid = require('./libs/liquid.min')
let store = require('./store')

module.exports = {
  store: store,
  libs: {
    log: log,
    helpers: helpers,
    airbrake: airbrake,
    domEvent: domEvent,
    Request: Request,
    Liquid: Liquid
  },
  eventSubscribe (key, fn) {
    eEmit.subscribe(key, fn)
  },
  pendingTasks: [],
  ready (nameVariable) {
    // Abort if object is undefined
    if (!window[nameVariable]) return false

    // Abort if bot detected
    if (robotDetection.is_bot()) return false

    new Pinger()

    const queue = window[nameVariable].q || []
    const self = this
    window[nameVariable] = function() {
      return self.pendingSend.apply(self, arguments)
    }
  
    // Plugins can only be included during initialization
    eEmit.subscribe('assets', () => { self.includePlugins() })

    webFormsViewer.init()

    for (const fields of queue) {
      this.pendingSend.apply(this, fields)
    }
  },
  // These are public methods used in api
  methods: {
    appKey () {
      const value = arguments[1]
      if (value && value.indexOf('@') > 0 && value.indexOf('@') < value.length - 1) {
        store.appKey = value
        store.region = value.split('@').pop()
        if (!store.trackerEndpoint) store.trackerEndpoint = `tracker-${store.region}.markeaze.com`
        if (!store.chatEndpoint) store.chatEndpoint = `chat-${store.region}.markeaze.com`
        // Set uid cookie
        const domain = (new baseDomain())
        store.uid = store.uid || cookies.get(store.cookieUid) || uuid.get(16)
        cookies.set(store.cookieUid, store.uid, { expires: 31536000, domain: domain.get() })
        // Call pending task
        for (let fields of this.pendingTasks) {
          this.send.apply(this, fields)
        }
        this.pendingTasks = []
        // Track change url
        this.changeUrl()
        domEvent.add(window, 'pushState', () => { this.changeUrl() })
        domEvent.add(window, 'replaceState', () => { this.changeUrl() })
        domEvent.add(window, 'hashchange', () => { this.changeUrl() })
      }
    },
    webFormPreviewUrl () {
      if (arguments[1]) store.webFormPreview = arguments[1]
    },
    webFormPreview () {
      if (arguments[1]) webFormsViewer.preview(arguments[1])
    },
    trackPageView () {
      const properties = this.pageData(arguments[1])
      if (properties.offer) properties.offer = this.offerNormalizer(properties.offer)
      if (properties.category) properties.category = this.categoryNormalizer(properties.category)
      return this.track(arguments[0], properties, arguments[2], arguments[3])
    },
    trackCartUpdate () {
      const properties = arguments[1]
      if (!properties.items) this.requiredFieldThrow('items')
      properties.items = properties.items.map((item) => {
        return this.itemNormalizer(item)
      })
      return this.track(arguments[0], properties, arguments[2], arguments[3])
    },
    trackCartUpdate () {
      const properties = arguments[1]
      if (!properties.items) this.requiredFieldThrow('items')
      properties.items = properties.items.map((item) => {
        return this.itemNormalizer(item)
      })
      return this.track(arguments[0], properties, arguments[2], arguments[3])
    },
    trackCartAddItem () {
      const properties = arguments[1]
      if (!properties.item) this.requiredFieldThrow('item')
      properties.item = this.itemNormalizer(properties.item)
      return this.track(arguments[0], properties, arguments[2], arguments[3])
    },
    trackCartRemoveItem () {
      const properties = arguments[1]
      if (!properties.item) this.requiredFieldThrow('item')
      properties.item = this.itemNormalizer(properties.item)
      return this.track(arguments[0], properties, arguments[2], arguments[3])
    },
    trackOrderCreate () {
      const properties = this.orderNormalizer(arguments[1])
      return this.track(arguments[0], properties, arguments[2], arguments[3])
    },
    trackVisitorUpdate () {
      this.methods.setVisitorInfo(null, arguments[1])
      return this.track(arguments[0], {})
    },
    trackCustom () {
      if (typeof arguments[1] === 'string') {
        return this.track(arguments[1], {}, arguments[2], arguments[3])
      }
    },
    trackWebFormShow () {
      const properties = this.pageData(arguments[1])
      return this.track(arguments[0], properties, arguments[2], arguments[3])
    },
    trackWebFormClick () {
      const properties = this.pageData(arguments[1])
      return this.track(arguments[0], properties, arguments[2], arguments[3])
    },
    trackWebFormSubmit () {
      const properties = this.pageData(arguments[1])
      return this.track(arguments[0], properties, arguments[2], arguments[3])
    },
    trackWebFormClose () {
      const properties = this.pageData(arguments[1])
      return this.track(arguments[0], properties, arguments[2], arguments[3])
    },
    debug () {
      store.debugMode = arguments[1]
    },
    setVisitorInfo () {
      let info = arguments[1]
      for (let key in info) store.visitor[key] = info[key]
      return store.visitor
    },
    getVisitorInfo () {
      return store.visitor
    },
    subscribe () {
      eEmit.subscribe(arguments[1], arguments[2])
    },
    version () {
      return store.version
    },
    updateStore () {
      if (typeof arguments[1] !== 'object') return
      store = Object.assign(store, arguments[1])
      return store
    },
    initPlugin () {
      const name = arguments[1]
      const plugin = arguments[2]
      // Plugin can be added only one time
      if (!store.plugins[name] || store.plugins[name].created || typeof plugin !== 'object' || typeof plugin.create !== 'function') return

      let options = {}
      if (name === 'chat') {
        const settings = store.assets.chat_settings
        const device = helpers.isMobile() ? 'mobile' : 'desktop'
        options = Object.assign({}, settings.common, settings[device])
      }

      store.plugins[name].created = true
      // Class in plugins cannot be used because link to store variables is lost
      store.plugins[name].app = plugin
      store.plugins[name].version = plugin.version
      store.plugins[name].app.store = this.store
      store.plugins[name].app.libs = this.libs
      store.plugins[name].app.create(store.assets.locale, options)
      return store.plugins[name]
    },
    destroyPlugin () {
      const name = arguments[1]
      if (!store.plugins[name] || !store.plugins[name].created) return
      store.plugins[name].created = false
      store.plugins[name].app.destroy()
      return store.plugins[name]
    },
    versionPlugin () {
      const name = arguments[1]
      if (!store.plugins[name] || !store.plugins[name].created) return
      return store.plugins[name].version
    }
  },
  includeScript (url) {
    const d = document
    const w = window
    let s = d.createElement('script')
    s.type = 'text/javascript'
    s.async = true
    s.charset = 'utf-8'
    s.src = url
    const x = d.getElementsByTagName('script')[0]
    x.parentNode.insertBefore(s, x)
  },
  includePlugins () {
    const chatSettings = store.assets.chat_settings
    store.plugins.chat.enabled = chatSettings && chatSettings.common.enabled

    for (const k in store.plugins) {
      if (store.plugins[k].enabled) this.includeScript(store.plugins[k].url)
    }
  },
  pageData (properties) {
    properties = properties || {}
    properties.page = properties.page || {}
    properties.page.url = properties.page.url || window.location.href
    properties.page.title = properties.page.title || document.title
    if (properties.page.referrer) properties.page.referrer = document.referrer
    return properties
  },
  offerNormalizer (offer) {
    if (offer.variant_id) offer.variant_id = String(offer.variant_id)
    else this.requiredFieldThrow('offer.variant_id')
    if (offer.price) offer.price = parseFloat(offer.price)
    else this.requiredFieldThrow('offer.price')
    return offer
  },
  itemNormalizer (item) {
    if (item.variant_id) item.variant_id = String(item.variant_id)
    else this.requiredFieldThrow('item.variant_id')
    if (item.qnt) item.qnt = parseFloat(item.qnt)
    else this.requiredFieldThrow('item.qnt')
    if (item.price) item.price = parseFloat(item.price)
    return item
  },
  categoryNormalizer (category) {
    if (category.uid) category.uid = String(category.uid)
    else this.requiredFieldThrow('category.uid')
    if (category.name) category.name = String(category.name)
    return category
  },
  orderNormalizer (order) {
    if (order.order_uid) order.order_uid = String(order.order_uid)
    else this.requiredFieldThrow('order.order_uid')
    if (order.total) order.total = parseFloat(order.total)
    else this.requiredFieldThrow('order.total')
    return order
  },
  requiredFieldThrow (field) {
    throw new Error(`"${field}" property is required`)
  },
  pendingSend () {
    log.push('action', arguments)
    const allowFirst = [
      'appKey', 'debug', 'webFormPreviewUrl', 'webFormPreview', 'updateStore'
    ]
    // Request to plugin
    if (!store.appKey && typeof arguments[0] != 'function' && arguments[0].indexOf(allowFirst) > -1) {
      return this.pendingTasks.push(arguments)
    }
    // Apply task
    else {
      return this.send.apply(this, arguments)
    }
  },
  send () {
    let obj = arguments[0]
    // Function run when the client is ready
    if (typeof obj == 'function') {
      return obj.apply(this)
    }
    else {
      // Request to plugin
      if (this.methods[ obj ]) {
        return this.methods[ obj ].apply(this, arguments)
      }
      // Custom event
      else if (arguments[0].indexOf('track') == 0) {
        return this.track(obj, arguments[1], arguments[2], arguments[3])
      }
    }
  },
  track (eventName, properies, callback, visitor) {
    return tracker.send(eventName, properies, callback, visitor)
  },
  changeUrl () {
    eEmit.emit('url.change', window.location.href)
  }
}
