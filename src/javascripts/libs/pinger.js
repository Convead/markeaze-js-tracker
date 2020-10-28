import Request from '../libs/request'
import store from '../store'
import robotDetection from '../libs/robot_detection'
import visibility from '../libs/visibility'

export default class Pinger {
  constructor (period) {
    this.ping_period = period || 15000
    this.hasFocus = true

    this.activity()

    window.setInterval(this.ping.bind(this), this.ping_period)

    this.moved = this.activity()
    this.typed = this.activity()
    this.clicked = this.activity()

    document.onmousedown = this.clicked
    document.onmousemove = this.moved
    document.onkeydown = this.typed
    document.onblur = this.blured
    document.onfocus = this.activity
  }
  blured () {
    this.hasFocus = false
  }
  activity () {
    this.hasFocus = true
  }
  ping () {
    if (!visibility.hasFocus() || !this.hasFocus) return
    if (robotDetection.is_bot()) return
    if (store.trackEnabled !== true) return

    this.blured()

    const request = new Request()
    request.send(
      store.pingerUrl || `https://${store.trackerEndpoint}/ping`,
      {
        app_key: store.appKey,
        device_uid: store.uid
      },
      (xhr) => {
        if (xhr.status === 403 || xhr.status === 0) robotDetection.detect()
      }
    )
  }
}
