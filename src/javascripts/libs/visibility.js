export default {
  hasFocus () {
    let method

    const html5VisApi = () => {
      const types = ['', 'webkit', 'moz', 'ms']
      for (var i = 0; i < types.length; i++) {
        const prefix = types[i]
        const prop = prefix.length > 0 ? `${prefix}Hidden` : 'hidden'
        if (typeof document[prop] !== 'undefined') return (() => document[prop])
      }
    }

    const focus = () => {
      if (typeof document.hasFocus === 'function') return !document.hasFocus()
    }

    if (typeof (method = html5VisApi()) === 'function') return !method()
    else return (typeof (method = focus()) === 'function') ? !method() : false
  }
}
