module.exports = class Animation

  constructor: (options) ->
    start = new Date; delta = options.delta || 'linear'; delay = options.delay || 10

    @timer = setInterval =>
      progress = (new Date - start) / options.duration;
      progress = 1 if (progress > 1)

      options.step @delta_functions[delta](@, progress, options.duration * progress, 0, 1, options.duration)

      if progress == 1
        clearInterval(@timer)
        options.complete && options.complete()
    , delay

  delta_functions:
    linear: (self, p) -> 
      p
    
    swing: (self, p) -> 
      0.5 - Math.cos( p * Math.PI ) / 2
    
    easeInQuad: (self, x, t, b, c, d) -> 
      c*(t/=d)*t + b
    
    easeOutQuad: (self, x, t, b, c, d) -> 
      -c *(t/=d)*(t-2) + b
    
    easeInOutQuad: (self, x, t, b, c, d) ->
      if(t/=d/2) < 1
        c/2*t*t + b
      else
        -c/2 * ((--t)*(t-2) - 1) + b
    
    easeInQuart: (self, x, t, b, c, d) ->
      c*(t/=d)*t*t*t + b
    
    easeOutQuart: (self, x, t, b, c, d) ->
      -c * ((t=t/d-1)*t*t*t - 1) + b
    
    easeInOutQuart: (self, x, t, b, c, d) ->
      if (t/=d/2) < 1
        return c/2*t*t*t*t + b
      -c/2 * ((t-=2)*t*t*t - 2) + b
