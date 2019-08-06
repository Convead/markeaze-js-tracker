const eEmit = require('../libs/eEmit')
const ImagesPreloader = require('../libs/imagesPreloader.coffee')
const VisitorLossDetection = require('../libs/visitorLossDetection.coffee')
const WebForm = require('./webForm').default
const airbrake = require('../libs/airbrake')
const Wrapper = require('./wrapper').default
const Request = require('../libs/request')
const config = require('../config')

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

      await this.wrapper.render(data.response)

      if (data.response.web_forms) for (const options of data.response.web_forms) {
        await this.preloadImages(options.body_html)
        this.add(options)
      }
      // Restoration of wefForms from the session is performed after receiving a list of new wefForms.
      // This is necessary to maintain priority of displaying more important wefForms.
      this.restoreHiddenList()
      this.archiveHiddenList()

      await this.wrapper.renderRibbons(this.webForms)
    })

    // The list of webForms should always be up to date
    eEmit.subscribe('WebForm.before_destroy', async (data) => {
      const wefForm = this.webForms[data.id]
      if (wefForm && wefForm.lossDetection) wefForm.lossDetection.abort()
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
          !webForm.api.isHidden
        ) webForm.api.hide()
      }

      this.wrapper.renderRibbons(this.webForms)
    })
    eEmit.subscribe('WebForm.after_close', async (data) => {
      this.wrapper.renderRibbons(this.webForms)
    })
  },
  preview (webFormId) {
    config.trackEnabled = false
    const xhr = new XMLHttpRequest()
    const path = typeof config.webFormPreviewPath === 'function' ? config.webFormPreviewPath.apply(this, [webFormId]) : `${config.webFormPreviewPath}?web_form_id=${webFormId}`

    xhr.open('GET', `//${config.endpoint}/${path}`, true)
    xhr.onload = async () => {
      if (xhr.readyState === 4 && xhr.status === 200) {
        const response = JSON.parse(xhr.responseText)

        this.destroyWebForms()

        await this.wrapper.render(response)

        for (const options of response.web_forms) this.add(options)
      }
    }
    xhr.send(null)
  },
  destroyWebForms () {
    for (const id in this.webForms) {
      const webForm = this.webForms[id]
      if (webForm.lossDetection) webForm.lossDetection.abort()
      webForm.api.destroy()
    }
    this.webForms = {}
  },
  add (options) {
    if (this.webForms[options.id]) return false

    if (this.exist(options)) {
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
    this.webForms[options.id] = options

    this.timeoutCallback(
        options.show_timeout,
        () => {
          if (this.webForms[options.id]) this.viewWithLossDetection(options)
        },
        () => {
          this.viewWithLossDetection(options)
        }
      )
  },
  archiveHiddenList () {
    const webFormsHidden = {}
    for (const id in this.webForms) {
      const webForm = Object.assign({}, this.webForms[id])
      if (webForm.can_be_hidden) {
        webForm.is_hidden = true
        webForm.on_exit = false
        webForm.show_timeout = 0
        webForm.close_timeout = 0
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
  viewWithLossDetection (options) {
    if (options.on_exit) {
      options.lossDetection = new VisitorLossDetection({
        detect: () => {
          this.view(options)
        }
      })
    }
    else this.view(options)
  },
  view (options) {
    this.webForms[options.id].api = new WebForm(options, this.wrapper.elWebForms)

    this.timeoutCallback(
        options.close_timeout,
        () => {
          if (this.webForms[options.id]) this.webForms[options.id].api.close(true)
        },
        () => {}
      )
  },
  exist (options) {
    for (const id in this.webForms) {
      const webForm = this.webForms[id]
      if (webForm.id !== options.id) return true
    }
    return false
  },
  preloadImages (html) {
    new Promise((resolve, reject) => {
      (new ImagesPreloader()).load(html, resolve)
    })
  },
  // Example:
  // timeoutString = "0" / "5..25" / "5" / 5 / 0
  timeoutCallback (timeoutString, callbackWithTimer, callbackWithoutTimer) {
    let timeout = parseInt(timeoutString)
    const delimeter = '..'
    if (typeof timeoutString === 'string') {
      if (timeoutString.indexOf(delimeter) > -1) {
        const interval = timeoutString.split(delimeter)
        const min = parseInt(interval[0])
        const max = parseInt(interval[1])
        timeout = Math.round(Math.random() * (max - min) + min)
      } else timeout = parseInt(timeoutString)
    }

    if (timeout > 0) setTimeout(callbackWithTimer, timeout * 1000)
    else callbackWithoutTimer()
  }
}
