module.exports = {
  events: {},
  subscribe (eventName, fn) {
    if (!this.events[eventName]) this.events[eventName] = []
    this.events[eventName].push(fn)
  },
  emit (eventName, data) {
    let event = this.events[eventName]
    if (event) {
      event.forEach((fn) => {
        fn.call(null, data)
      })
    }
  }
}
