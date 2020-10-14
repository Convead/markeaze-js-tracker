export default () => {
  if (!window.history) return

  window.history.pushState = ( f => function pushState() {
    const ret = f.apply(this, arguments)
    window.dispatchEvent(new Event('pushState'))
    return ret
  })(window.history.pushState)

  window.history.replaceState = ( f => function replaceState() {
    const ret = f.apply(this, arguments)
    window.dispatchEvent(new Event('replaceState'))
    return ret
  })(window.history.replaceState)
}
