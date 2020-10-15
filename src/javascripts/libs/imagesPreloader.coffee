module.exports = class ImagesPreloader

  delay: 2000

  constructor: ->

  load: (html, callback) ->
    urls = @find html
    @load_images urls, callback

  # Finds images urls and return the array
  find: (html) ->
    images = []
    tmp_el = document.createElement('div')
    tmp_el.innerHTML = html

    # Find img tags
    image_tags = tmp_el.querySelectorAll('img')
    for image in image_tags
      images.push image.src

    # Find styles with images
    eachChilds = (items) ->
      return if typeof items != 'object' && items.length > 0
      for item in items
        if item && item.style && item.style.backgroundImage
          bg = item.style.backgroundImage
          images.push( bg.replace(new RegExp('^url\\(|[\\)\\"\']+', 'ig'), '') ) if new RegExp('^url\\([^\)]*\\)$', 'ig').test(bg)
        eachChilds item.childNodes
    eachChilds tmp_el.childNodes

    images

  # Preload array url of images
  load_images: (arr, callback) ->
    if arr.length == 0
      callback()
      return
      
    num_total = arr.length
    num_preloaded = 0
    complete = false

    timer = setTimeout (->
        if !complete
          complete = true
          callback()
      ), @delay
    
    counter = ->
      num_preloaded++
      if num_total == num_preloaded && !complete
        complete = true
        clearTimeout timer
        callback()
    
    for url in arr
      img = new Image()
      img.onload = -> counter()
      img.src = url
