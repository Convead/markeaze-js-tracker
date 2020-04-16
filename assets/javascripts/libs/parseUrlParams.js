const fn = (urlParams) => {
  const temp = {}
  urlParams.replace(/\??(?:([^=]+)=([^&]*)&?)/g, () => {
    const decode = function(s) {
      return decodeURIComponent(s.split("+").join(" "))
    }
    temp[decode(arguments[1])] = decode(arguments[2])
  })
  return temp
}

export default fn
