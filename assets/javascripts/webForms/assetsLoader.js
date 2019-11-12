const store = require('../store')

export default class AssetsLoader {
  constructor (storageName, storeName) {
    this.assetsName = storageName
    this.storeName = storeName

    this.assets = null

    const str = window.localStorage.getItem(this.assetsName)
    if (str != null) {
      try {
        this.assets = JSON.parse(str)
        store[this.storeName] = this.assets.version
      }
      catch {}
    }
  }
  load (assets) {
    if (!assets) return false

    if (!this.assets || this.assets.version !== assets.version) {
      this.assets = Object.assign((this.assets || {}), assets)
      store[this.storeName] = this.assets.version
      window.localStorage.setItem(this.assetsName, JSON.stringify(assets))
      return true
    }
    return false
  }
}
