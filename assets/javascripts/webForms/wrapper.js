const Liquid = require('../libs/liquid.min')
const liquid = new Liquid()
const domEvent = require('../libs/domEvent')
const helpers = require('../helpers')
const eEmit = require('../libs/eEmit')
const store = require('../store')

export default class Wrapper {
  constructor (elContainer) {
    this.elContainer = elContainer || document.body
    this.el = null
  }
  async render () {
    if (this.el || !store.assets || !store.assets.web_forms_common_wrapper) return false

    const css = store.assets.web_forms_css || ''
    this.el = document.querySelector('.mkz-js-main') || helpers.appendHTML(this.elContainer, store.assets.web_forms_common_wrapper)
    helpers.appendHTML(this.el, `<style type="text/css">${css}</style>`)
    this.elRibbons = this.el.querySelector('.mkz-js-ribbons')
    this.elWebForms = this.el.querySelector('.mkz-js-wfs')
  }
  async renderRibbons (webForms) {
    if (!store.assets || !store.assets.web_forms_ribbons_wrapper) return false

    const html = await liquid.parseAndRender(store.assets.web_forms_ribbons_wrapper, {
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
