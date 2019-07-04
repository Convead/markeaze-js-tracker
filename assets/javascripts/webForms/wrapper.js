const Liquid = require('../libs/liquid.min')
const liquid = new Liquid()
const domEvent = require('../libs/domEvent')
const helpers = require('../helpers')
const eEmit = require('../libs/eEmit')
const AssetsLoader = require('../webForms/assetsLoader').default
const config = require('../config')

export default class Wrapper {
  constructor (elContainer) {
    this.mainAssetsLoader = new AssetsLoader('mkz_main_assets', 'mainAssetsVersion')
    this.accountAssetsLoader = new AssetsLoader('mkz_account_assets', 'accountAssetsVersion')

    this.elContainer = elContainer || document.body
    this.el = null
  }
  async render (resource) {
    // Update for the first time or if there are changes
    if (this.mainAssetsLoader.load(resource.assets) || !this.el) {
      if (!this.mainAssetsLoader.assets) return false

      this.accountAssetsLoader.load(resource.accountAssets)

      const css = this.accountAssetsLoader.assets ? this.accountAssetsLoader.assets.css : ''
      const html = await liquid.parseAndRender(
        this.mainAssetsLoader.assets.web_forms_common_wrapper,
        {css: css}
      )
      this.el = document.querySelector('.mkz-js-main') || helpers.appendHTML(this.elContainer, html)
      this.elRibbons = this.el.querySelector('.mkz-js-ribbons')
      this.elWebForms = this.el.querySelector('.mkz-js-wfs')
    }
  }
  async renderRibbons (webForms) {
    if (!this.mainAssetsLoader.assets) return false

    const html = await liquid.parseAndRender(this.mainAssetsLoader.assets.web_forms_ribbons_wrapper, {
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
