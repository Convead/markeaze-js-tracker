import domEvent from './domEvent'

export default class VisitorLossDetection {
  constructor (options) {
    this.options = options
    this.status = 'initial'
    this.event = ''
    this.cursor_offset_top = 0
    this.cursor_offset_top_max = 100

    this.remaining_seconds = this.options.delay
    if (this.remaining_seconds > 0) this.start_timer()
    else this.expire()

    this.bind_events()
  }

  bind_events () {
    const $el = document.body
    const self = this

    domEvent.add($el, 'mouseover', function (e) {
      let toElement = e.relatedTarget || e.fromElement
      while (toElement && toElement !== this) toElement = toElement.parentNode

      if (toElement === this) return
      if (self.status !== 'initial') return

      if (self.event === 'mouseover') return
      else self.event = 'mouseover'

      self.start_timer()
    })

    domEvent.add($el, 'mouseout', function (e) {
      e = e || window.event
      if (typeof e.pageY == 'number') {
        self.cursor_offset_top = e.pageY - document.body.scrollTop - document.documentElement.scrollTop
      } else if (typeof e.clientY == 'number') {
        self.cursor_offset_top = e.clientY
      } else {
        self.cursor_offset_top = 0
      }

      let toElement = e.relatedTarget || e.toElement
      while (toElement && toElement !== this) toElement = toElement.parentNode
      if (toElement === this) return

      if (self.status === 'detected') return

      if (self.event != 'mouseout' && self.cursor_offset_top < self.cursor_offset_top_max) {
        self.event = 'mouseout'
      } else {
        return
      }

      if (self.status == 'expired') self.detect()
      else self.stop_timer()
    })
  }

  start_timer () {
    if (this.timer_id) return
    this.timer_id = setInterval(this.tick_timer, 1000)
  }

  stop_timer () {
    if (!this.timer_id) return
    clearInterval(this.timer_id)
    this.timer_id = null
  }

  tick_timer () {
    this.remaining_seconds -= 1
    if (this.remaining_seconds === 0) {
      clearInterval(this.timer_id)
      this.expire()
    }
  }

  expire () {
    this.status = 'expired'
  }

  detect () {
    this.status = 'detected'
    this.options.detect && this.options.detect()
  }

  abort () {
    this.status = 'detected'
  }
}
