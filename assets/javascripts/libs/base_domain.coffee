class ConveadClient.BaseDomain

  constructor: (currentDomain) ->
    @currentDomain = currentDomain || document.domain
    @baseDomain = null

  get: () ->
    return @baseDomain if @baseDomain

    domain = @currentDomain
    i = 0
    p = domain.split('.')
    s = '_gd'+(new Date()).getTime()
    while (i < (p.length-1) && document.cookie.indexOf(s+'='+s) == -1)
      domain = p.slice(-1-(++i)).join('.')
      document.cookie = s+"="+s+";domain="+domain+";"
    document.cookie = s+"=;expires=Thu, 01 Jan 1970 00:00:01 GMT;domain="+domain+";"
    @baseDomain = domain

    return @baseDomain
