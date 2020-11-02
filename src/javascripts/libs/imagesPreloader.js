export default class ImagesPreloader {
  constructor () {
    this.delay = 2000
  }

  load (html, callback) {
    const urls = this.find(html)
    this.loadImages(urls, callback)
  }

  // Finds images urls and return the array
  find (html) {
    const tmpEl = document.createElement('div')
    tmpEl.innerHTML = html

    // Find img tags
    const imageEls = tmpEl.querySelectorAll('img')
    const images = Object.values(imageEls).map((i) => i.src)

    // Find styles with images
    const eachChilds = (items) => {
      if (typeof items != 'object' && items.length > 0) return
      items.forEach((item) => {
        if (item?.style?.backgroundImage) {
          const bg = item.style.backgroundImage
          if (new RegExp('^url\\([^\)]*\\)$', 'ig').test(bg)) {
            images.push( bg.replace(new RegExp('^url\\(|[\\)\\"\']+', 'ig'), '') )
          }
        }
        eachChilds(item.childNodes)
      })
    }
    eachChilds(tmpEl.childNodes)

    return images
  }

  // Preload array url of images
  loadImages (arr, callback) {
    if (arr.length === 0) {
      return callback()
    }

    const numTotal = arr.length
    let numPreloaded = 0
    let complete = false

    const timer = setTimeout(() => {
      if (!complete) {
        complete = true
        callback()
      }
    }, this.delay)

    const counter = () => {
      numPreloaded++
      if (numTotal === numPreloaded && !complete) {
        complete = true
        clearTimeout(timer)
        callback()
      }
    }

    arr.forEach((url) => {
      const img = new Image()
      img.onload = () => counter()
      img.src = url
    })
  }
}
