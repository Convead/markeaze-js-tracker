export default class Animation {
  constructor (options) {
    const start = new Date
    const delta = options.delta || 'linear'
    const delay = options.delay || 10

    this.timer = setInterval(() => {
      const progress = (new Date - start) / options.duration
      if (progress > 1) progress = 1

      options.step(this.delta_functions[delta](this, progress, options.duration * progress, 0, 1, options.duration))

      if (progress === 1) {
        clearInterval(this.timer)
        options.complete && options.complete()
      }
    }, delay)
  }

  delta_functions () {
    return {
      linear (self, p) {
        return p
      },
      swing (self, p) {
        return 0.5 - Math.cos( p * Math.PI ) / 2
      },
      easeInQuad (self, x, t, b, c, d) {
        return c*(t/=d)*t + b
      },
      easeOutQuad (self, x, t, b, c, d) {
        return -c *(t/=d)*(t-2) + b
      },
      easeInOutQuad (self, x, t, b, c, d) {
        if ((t/=d/2) < 1) return c/2*t*t + b
        else return -c/2 * ((--t)*(t-2) - 1) + b
      },
      easeInQuart (self, x, t, b, c, d) {
        return c*(t/=d)*t*t*t + b
      },
      easeOutQuart (self, x, t, b, c, d) {
        return -c * ((t=t/d-1)*t*t*t - 1) + b
      },
      easeInOutQuart (self, x, t, b, c, d) {
        if ((t/=d/2) < 1) return c/2*t*t*t*t + b
        else return -c/2 * ((t-=2)*t*t*t - 2) + b
      }
    }
  }
}
