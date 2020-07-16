import notifier from './notifier'

export default {
  events: {},
  subscribe (eventName, fn) {
    if (!this.events[eventName]) this.events[eventName] = []
    this.events[eventName].push(fn)
  },
  emit (eventName, data) {
    const event = this.events[eventName]
    if (event) {
      notifier.call(() =>{
        event.forEach((fn) => {
          fn.call(null, data)
        })
      })
    }
  }
}
