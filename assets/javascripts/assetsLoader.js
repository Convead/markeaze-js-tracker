const store = require('./store')

export default class AssetsLoader {
  constructor () {
    this.assetsName = 'mkz_assets'

    const str = window.localStorage.getItem(this.assetsName)
    if (str != null) {
      try {
        store.assets = JSON.parse(str)
      }
      catch {}
    }
  }
  load (assets) {
    if (!assets) return false

    if (!store.assets || store.assets.version !== assets.version) {
      store.assets = Object.assign({}, store.assets, assets)
      window.localStorage.setItem(this.assetsName, JSON.stringify(assets))
      return true
    }
    return false
  }
}
