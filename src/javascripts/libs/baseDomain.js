export default class BaseDomain {
  constructor (currentDomain) {
    this.currentDomain = currentDomain || document.domain
    this.baseDomain = null
  }
  get () {
    if (this.baseDomain) return this.baseDomain

    let domain = this.currentDomain
    let i = 0
    let p = domain.split('.')
    const s = '_gd' + (new Date()).getTime()
    while (i < (p.length-1) && document.cookie.indexOf(`${s}=${s}`) === -1) {
      domain = p.slice(-1-(++i)).join('.')
      document.cookie = `${s}=${s};domain=${domain};`
    }
    document.cookie = `${s}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;domain=${domain};`
    this.baseDomain = domain

    return this.baseDomain
  }
}
