const config = require('../config')

export default class AssetsLoader {
  constructor (storageName, configName) {
    this.assetsName = storageName
    this.configName = configName

    this.assets = null

    const str = window.localStorage.getItem(this.assetsName)
    if (str != null) {
      try {
        this.assets = JSON.parse(str)
        config[this.configName] = this.assets.version
      }
      catch {}
    }
  }
  load (assets) {
    if (!assets) return false

    if (!this.assets || this.assets.version !== assets.version) {
      this.assets = assets
      config[this.configName] = this.assets.version
      window.localStorage.setItem(this.assetsName, JSON.stringify(assets))
      return true
    }
    return false
  }
}