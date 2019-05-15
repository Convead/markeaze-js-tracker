const eEmit = require('../libs/eEmit')
const ImagesPreloader = require('../libs/imagesPreloader.coffee')
const VisitorLossDetection = require('../libs/visitorLossDetection.coffee')
const WebForm = require('./webForm').default
const airbrake = require('../libs/airbrake')
const Wrapper = require('./wrapper').default

module.exports = {
  webForms: {},
  sessionListName: 'mkz_hidden_web_forms',
  wrapper: null,

  init () {
    this.wrapper = new Wrapper()

    // View webForms
    eEmit.subscribe('track.after', async (data) => {
      if (data.post.type !== 'page_view') return false

      // Support Single Page Application web sites
      this.destroyWebForms()

      this.wrapper.render(data.response.assets)

      if (data.response.web_forms) for (const options of data.response.web_forms) {
        await this.preloadImages(options.body_html)
        options.ribbon_type = this.getRibbonType(options.display_type)
        this.add(options)
      }
      // Restoration of wefForms from the session is performed after receiving a list of new wefForms.
      // This is necessary to maintain priority of displaying more important wefForms.
      this.restoreHiddenList()
      this.archiveHiddenList()

      this.wrapper.renderRibbons(this.webForms)
    })

    // The list of webForms should always be up to date
    eEmit.subscribe('WebForm.before_destroy', async (data) => {
      const wefForm = this.webForms[data.id]
      if (wefForm.lossDetection) wefForm.lossDetection.abort()
      delete this.webForms[data.id]
      this.archiveHiddenList()

      this.wrapper.renderRibbons(this.webForms)
    })

    // Blocking the display of two webForms of the same type.
    // The first is hiding.
    eEmit.subscribe('WebForm.after_show', async (data) => {
      const webFormCurrent = this.webForms[data.id]
      for (const id in this.webForms) {
        const webForm = this.webForms[id]
        if (
          webForm.id !== webFormCurrent.id && 
          webForm.display_type !== 'notice' &&
          webForm.display_type === webFormCurrent.display_type && 
          !webForm.api.isHidden
        ) webForm.api.hide()
      }

      this.wrapper.renderRibbons(this.webForms)
    })
    eEmit.subscribe('WebForm.after_close', async (data) => {
      this.wrapper.renderRibbons(this.webForms)
    })
  },
  destroyWebForms () {
    for (const id in this.webForms) {
      const webForm = this.webForms[id]
      if (wefForm.lossDetection) wefForm.lossDetection.abort()
      webForm.api.destroy()
    }
    this.webForms = {}
  },
  add (options) {
    if (this.webForms[options.id]) return false

    // Notice webForms can show up at a time
    if (options.display_type !== 'notice') {

      if (this.hasType(options)) {
        if (options.can_be_hidden) options.is_hidden = true
        else {
          airbrake.send(
              'Error! Invalid webForm display script.',
              'viewer.js',
              82,
              'add',
              {web_form_id: options.id}
            )
          return false
        }
      }

    }
    this.webForms[options.id] = options

    if (options.on_exit) {
      options.lossDetection = new VisitorLossDetection({
        detect: () => {
          this.view(options)
        }
      })
    }
    else this.view(options)
  },
  archiveHiddenList () {
    const webFormsHidden = {}
    for (const id in this.webForms) {
      const webForm = Object.assign({}, this.webForms[id])
      if (webForm.can_be_hidden) {
        webForm.is_hidden = true
        webForm.on_exit = false
        delete webForm.api
        delete webForm.lossDetection

        webFormsHidden[id] = webForm
      }
    }
    window.sessionStorage.setItem(this.sessionListName, JSON.stringify(webFormsHidden))
  },
  restoreHiddenList () {
    const str = window.sessionStorage.getItem(this.sessionListName)
    if (!str) return false
    const webFormsHidden = JSON.parse(str)
    for (const id in webFormsHidden) this.add(webFormsHidden[id])
  },
  view (options) {
    this.webForms[options.id].api = new WebForm(options, this.wrapper.elWebForms)
  },
  hasType (options) {
    for (const id in this.webForms) {
      const webForm = this.webForms[id]
      if (webForm.id !== options.id && webForm.display_type === options.display_type) return true
    }
    return false
  },
  preloadImages (html) {
    new Promise((resolve, reject) => {
      (new ImagesPreloader()).load(html, resolve)
    })
  },
  getRibbonType (type) {
    switch(type) {
      case 'fly-out':
        return 'round'
      case 'footer':
        return 'round'
      default:
        return 'aside'
    }
  }
}
