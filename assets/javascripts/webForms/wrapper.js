const Liquid = require('../libs/liquid.min')
const liquid = new Liquid()
const domEvent = require('../libs/domEvent')
const helpers = require('../helpers')
const eEmit = require('../libs/eEmit')
const AssetsLoader = require('../webForms/assetsLoader').default
const config = require('../config')

export default class Wrapper {
  constructor (elContainer) {
    this.assetsLoader = new AssetsLoader('mkz_assets', 'assetsVersion')

    this.elContainer = elContainer || document.body
    this.el = null
  }
  async render (resource) {
    // Update for the first time or if there are changes
    if (this.assetsLoader.load(resource.assets) || !this.el) {
      if (!this.assetsLoader.assets) return false

      this.assetsLoader.load(resource.accountAssets)

      const css = this.assetsLoader.assets ? this.assetsLoader.assets.web_forms_css : ''
      this.el = document.querySelector('.mkz-js-main') || helpers.appendHTML(this.elContainer, this.assetsLoader.assets.web_forms_common_wrapper)
      helpers.appendHTML(this.el, `<style type="text/css">${css}</style>`)
      this.elRibbons = this.el.querySelector('.mkz-js-ribbons')
      this.elWebForms = this.el.querySelector('.mkz-js-wfs')
    }
  }
  async renderRibbons (webForms) {
    if (!this.assetsLoader.assets) return false

    const html = await liquid.parseAndRender(this.assetsLoader.assets.web_forms_ribbons_wrapper, {
      web_forms: Object.values(webForms),
      ribbon_types: ['aside', 'round']
    })
    this.elRibbons.innerHTML = html

    for (const uid in webForms) {
      const webForm = webForms[uid]
      
      const elRibbon = this.elRibbons.querySelector(`.mkz-js-ribbon-${webForm.uid}`)

      if (elRibbon) domEvent.add(elRibbon, 'click', () => {
        if (!webForm.is_hidden) return false
        webForm.is_hidden = false
        webForm.api.render()
      })
    }
  }
}
