import eEmit from './libs/eEmit'
import cookies from './libs/cookies'
import uuid from './libs/uuid'
import log from './libs/log'
import parseUrlParams from './libs/parseUrlParams'
import baseDomain from './libs/baseDomain'
import tracker from './tracker'
import webFormsViewer from './webForms/viewer'
import autoMsg from './autoMsg'
import Pinger from './libs/pinger'
import robotDetection from './libs/robot_detection'
import helpers from './helpers'
import { notifierInstance, default as notifier } from './libs/notifier'
import domEvent from './libs/domEvent'
import Request from './libs/request'
import Liquid from './libs/liquid.min'
import Validation from './libs/simpleValidation'
import FormToObject from './libs/formToObject'
import initHistoryState from './libs/historyState'
import { default as store, commit as storeCommit } from './store'

export default {
  store: store,
  libs: {
    log,
    helpers,
    notifierInstance,
    notifier,
    domEvent,
    Request,
    Liquid,
    eEmit,
    Validation,
    FormToObject
  },
  pendingTasks: [],
  pageViewProperties: {},
  ready (nameVariable) {
    if (typeof window.localStorage === 'undefined') return console.warn('"localStorage" method is not supported')
    // It use in liquid parser
    if (typeof window.Symbol !== 'function') return console.warn('"Symbol" method is not supported')

    // Abort if object is undefined
    if (!window[nameVariable]) return false

    initHistoryState()

    // Abort if bot detected
    if (robotDetection.is_bot()) return false

    new Pinger()

    const queue = window[nameVariable].q || []
    const self = this
    window[nameVariable] = function () {
      return self.pendingSend.apply(self, arguments)
    }

    // Plugins can only be included during initialization
    eEmit.subscribe('assets', () => {
      notifier.call(() => self.includePlugins.apply(self))
    })

    helpers.ready(() => {
      webFormsViewer.init()
      autoMsg.init()

      for (const fields of queue) {
        this.pendingSend.apply(this, fields)
      }
    })

  },
  // These are public methods used in the api
  methods: {
    appKey () {
      const value = arguments[1]
      if (!value || value.indexOf('@') === -1) return

      store.appKey = value
      store.region = value.split('@').pop()

      if (!store.trackerEndpoint) store.trackerEndpoint = `tracker-${store.region}.markeaze.com`
      if (!store.chatEndpoint) store.chatEndpoint = `chat-${store.region}.markeaze.com`

      // Set uid cookie
      this.methods.setDeviceUid.apply(this)
      // Call pending task
      for (let fields of this.pendingTasks) {
        this.send.apply(this, fields)
      }
      this.pendingTasks = []

      // Delay to start the callback last in the event loop
      setTimeout(() => {
        // Track change url
        this.changeUrl()
        domEvent.add(window, 'pushState', () => { this.changeUrl() })
        domEvent.add(window, 'replaceState', () => { this.changeUrl() })
        domEvent.add(window, 'hashchange', () => { this.changeUrl() })
      }, 0)
    },
    setDeviceUid () {
      const newUid = arguments[1] || null
      const force = arguments[2] || false
      const domain = (new baseDomain())
      store.uid = (force && newUid) || store.uid || cookies.get(store.cookieUid) || newUid || uuid.get(16)
      cookies.set(store.cookieUid, store.uid, { expires: 31536000, domain: domain.get() })
    },
    webFormPreviewUrl () {
      if (arguments[1]) store.webFormPreview = arguments[1]
    },
    webFormPreview () {
      if (arguments[1]) webFormsViewer.preview(arguments[1])
    },
    trackPageView () {
      const properties = Object.assign({}, this.pageViewProperties, this.pageData(arguments[1]))
      if (properties.offer) properties.offer = this.offerNormalizer(properties.offer)
      if (properties.category) properties.category = this.categoryNormalizer(properties.category)
      this.pageViewProperties = {}
      return this.track(arguments[0], properties, arguments[2], arguments[3])
    },
    trackCartUpdate () {
      const properties = arguments[1]
      if (!properties.items) this.requiredFieldThrow('items')
      properties.items = properties.items.map(this.itemNormalizer)
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
    trackAutoMessageShow () {
      const properties = this.pageData(arguments[1])
      return this.track(arguments[0], properties, arguments[2], arguments[3])
    },
    trackAutoMessageReply () {
      const properties = this.pageData(arguments[1])
      return this.track(arguments[0], properties, arguments[2], arguments[3])
    },
    setCategoryView () {
      this.pageViewProperties.category = this.categoryNormalizer(arguments[1])
    },
    setOfferView () {
      this.pageViewProperties.offer = this.offerNormalizer(arguments[1])
    },
    debug () {
      store.debugMode = arguments[1]
    },
    setVisitorInfo () {
      const info = arguments[1]
      for (const key in info) store.visitor[key] = info[key]
      return store.visitor
    },
    clearVisitorInfo () {
      store.visitor = {}
      return store.visitor
    },
    getVisitorInfo () {
      return store.visitor
    },
    watch () {
      eEmit.subscribe(arguments[1], arguments[2])
    },
    version () {
      return store.version
    },
    updateStore () {
      if (typeof arguments[1] !== 'object') return

      const data = arguments[1]
      for (const key in data) storeCommit(key, data[key])
      return store
    },
    initPlugin () {
      const name = arguments[1]
      const app = arguments[2]
      const plugin = store.plugins[name]

      if (!app && !plugin) return

      const settings = plugin.settings || {}

      if (plugin.created) this.methods.destroyPlugin.apply(this, [null, name])

      if (app && !plugin.loaded) {
        plugin.app = app
        plugin.loaded = true
        plugin.version = app.version
        plugin.app.store = this.store
        plugin.app.libs = this.libs
      }

      plugin.created = true
      plugin.app.create(store.assets.locale, settings)

      eEmit.emit(`plugin.${name}.${app ? 'created' : 'updated'}`, plugin)

      return plugin
    },
    applyPlugin () {
      const name = arguments[1]
      const plugin = store.plugins[name]

      if (name === 'chat' && store.assets) {
        const chatSettings = store.assets.chat_settings
        plugin.enabled = chatSettings && chatSettings.appearance.common.enabled
        const device = helpers.isMobile() ? 'mobile' : 'desktop'
        plugin.settings = { ...plugin.settings, ...chatSettings }
        plugin.settings.appearance = Object.assign({}, chatSettings.appearance.common, chatSettings.appearance[device])
      }

      if (!plugin.enabled) return this.methods.destroyPlugin.apply(this, [null, name])

      if (plugin.created) this.methods.initPlugin.apply(this, [null, name])

      if (!plugin.loaded) {
        const version = cookies.get(`mkz_${name}_version`) || 'latest'
        this.includeScript(plugin.url.replace('@latest', `@${version}`))
      }
    },
    destroyPlugin () {
      const name = arguments[1]
      const plugin = store.plugins[name]

      if (!plugin || !plugin.created) return

      plugin.created = false
      plugin.app.destroy()

      eEmit.emit(`plugin.${name}.destroyed`)

      return plugin
    },
    setPluginSettings () {
      const name = arguments[1]
      const plugin = store.plugins[name]

      if (!plugin) return

      const newSettings = arguments[2] || {}
      plugin.settings = { ...plugin.settings, ...newSettings }
      eEmit.emit(`plugin.${name}.update`, plugin.settings)
    },
    emitPlugin () {
      const name = arguments[1]
      const plugin = store.plugins[name]

      if (!plugin) return

      eEmit.emit(`plugin.${name}.${arguments[2]}`, arguments[3])
    },
    pluginVersion () {
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
    for (const k in store.plugins) this.methods.applyPlugin.apply(this, [null, k])
  },
  pageData (properties) {
    properties = properties || {}
    properties.page = properties.page || {}
    properties.page.url = this.fixUrl(properties.page.url || window.location.href)
    properties.page.title = properties.page.title || document.title
    if (!properties.page.title) delete properties.page.title
    if (properties.page.referrer) properties.page.referrer = document.referrer
    return properties
  },
  fixUrl (url) {
    try {
      return encodeURI(decodeURI(url))
    }
    catch (e) {
      console.warn(e)
    }
  },
  offerNormalizer (offer) {
    if (offer.variant_id) offer.variant_id = String(offer.variant_id)
    else this.requiredFieldThrow('offer.variant_id')
    if (offer.url) offer.url = this.fixUrl(offer.url)
    return offer
  },
  itemNormalizer (item) {
    if (item.variant_id) item.variant_id = String(item.variant_id)
    else this.requiredFieldThrow('item.variant_id')
    if (item.qnt) item.qnt = parseFloat(item.qnt)
    else this.requiredFieldThrow('item.qnt')
    if (item.price) item.price = parseFloat(item.price)
    if (item.url) item.url = this.fixUrl(item.url)
    return item
  },
  categoryNormalizer (category) {
    if (category.uid) category.uid = String(category.uid)
    else this.requiredFieldThrow('category.uid')
    if (category.name) category.name = String(category.name)
    return category
  },
  orderNormalizer (order) {
    if (order.external_id) order.external_id = parseInt(order.external_id)
    if (order.order_uid) order.order_uid = String(order.order_uid)
    else this.requiredFieldThrow('order.order_uid')
    if (order.total) order.total = parseFloat(order.total)
    else this.requiredFieldThrow('order.total')
    if (!order.items) this.requiredFieldThrow('order.items')
    order.items = order.items.map(this.itemNormalizer)
    for (const field of ['trigger_value', 'tracking_number', 'fulfillment_status', 'financial_status', 'payment_method', 'shipping_method']) {
      if (order[field]) order[field] = String(order[field])
    }
    return order
  },
  requiredFieldThrow (field) {
    throw new Error(`"${field}" property is required`)
  },
  pendingSend () {
    log.push('action', arguments)
    const argument = arguments[0]
    const allowFirst = [
      'appKey',
      'debug',
      'webFormPreviewUrl',
      'webFormPreview',
      'updateStore',
      'setDeviceUid',
      'setVisitorInfo',
      'clearVisitorInfo',
      'watch',
      'updateStore',
      'version'
    ]
    if (!store.appKey && typeof argument !== 'function' && allowFirst.indexOf(argument) === -1) {
      return this.pendingTasks.push(arguments)
    } else {
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
      if (this.methods[ obj ]) {
        return this.methods[ obj ].apply(this, arguments)
      } else if (arguments[0].indexOf('track') == 0) {
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
