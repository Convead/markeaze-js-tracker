const Liquid = require('../libs/liquid.min')
const liquid = new Liquid()
const domEvent = require('../libs/domEvent')
const helpers = require('../helpers')
const eEmit = require('../libs/eEmit')
const config = require('../config')

export default class Wrapper {
  constructor (elContainer) {
    this.assetsName = 'mkz_assets'
    this.elContainer = elContainer || document.body
    this.assets = null
    this.el = null

    const str = window.localStorage.getItem(this.assetsName)
    if (str != null) {
      this.assets = JSON.parse(str)
      config.assetsVersion = this.assets.assets_version
    }
  }
  assetsLoader (assets) {
    if (!assets) return false

    if (!this.assets || this.assets.version !== assets.version) {
      this.assets = assets
      config.assetsVersion = this.assets.assets_version
      window.localStorage.setItem(this.assetsName, JSON.stringify(assets))
      return true
    }
    return false
  }
  render (assets) {
    // Update for the first time or if there are changes
    if (this.assetsLoader(assets) || !this.el) {
      if (!this.assets) return false
      this.el = document.querySelector('.mkz-js-main') || helpers.appendHTML(this.elContainer, this.assets.web_forms_common_wrapper)
      this.elRibbons = this.el.querySelector('.mkz-js-ribbons')
      this.elWebForms = this.el.querySelector('.mkz-js-wfs')
    }
  }
  async renderRibbons (webForms) {
    const html = await liquid.parseAndRender(this.assets.web_forms_ribbons_wrapper, {
      web_forms: Object.values(webForms),
      ribbon_types: ['aside', 'round']
    })
    this.elRibbons.innerHTML = html

    for (const id in webForms) {
      const webForm = webForms[id]
      
      const elRibbon = this.elRibbons.querySelector(`.mkz-js-ribbon-${webForm.id}`)

      if (elRibbon) domEvent.add(elRibbon, 'click', () => {
        if (!webForm.is_hidden) return false
        webForm.is_hidden = false
        webForm.api.render()
      })
    }
  }
}
