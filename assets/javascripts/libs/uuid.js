module.exports = {
  CHARS: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  get (len, radix) {
    let chars = this.CHARS.split('')
    let uuid = []
    radix = radix || chars.length
    for (let i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix]
    return uuid.join('')
  }
}