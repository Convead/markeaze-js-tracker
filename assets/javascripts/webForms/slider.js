import domEvent from '../libs/domEvent'
import helpers from '../helpers'

export default class Slider {
  constructor () {
    this.index = 0
    this.time = 400

    domEvent.add(window, 'resize', () => this.render())
  }
  setContainer (el) {
    this.el = el
    this.elSlider = el.querySelector('.mkz-js-slider')
    this.elSliderWrap = el.querySelector('.mkz-js-slider-wrap')
    this.elSliderItems = el.querySelectorAll('.mkz-js-slider-i')
    this.elSliderPrev = el.querySelector('.mkz-js-slider-prev')
    this.elSliderNext = el.querySelector('.mkz-js-slider-next')
    this.maxIndex = this.elSliderItems.length

    if (!this.maxIndex) return false

    this.render()
  }
  render () {
    if (!this.maxIndex) return false

    this.itemWidth = this.elSliderItems[0].offsetWidth
    this.maxView = Math.round(this.elSliderWrap.offsetWidth / this.itemWidth)
    this.index = 0

    this.elSlider.style.left = this.itemWidth * this.index + 'px'
    
    this.renderNavi()
  }
  prev () {
    if (!this.maxIndex) return false

    if (this.allowPrev()) {
      this.animate(this.index, this.index - 1)
      this.index--
      this.renderNavi()
    }
  }
  next () {
    if (!this.maxIndex) return false
    
    if (this.allowNext()) {
      this.animate(this.index, this.index + 1)
      this.index++
      this.renderNavi()
    }
  }
  animate (oldIndex, newIndex) {
    if (this.timer) clearInterval(this.timer)
    this.timer = helpers.animate({
      el: this.elSlider,
      prop: 'left',
      dimension: 'px',
      start: this.itemWidth * oldIndex,
      end: this.itemWidth * newIndex,
      duration: this.time,
      delta: 'easeOutQuart',
      complete: () => {}
    }).timer
  }
  allowNext () {
    return this.index < 0
  }
  allowPrev () {
    return this.index > this.maxView - this.maxIndex
  }
  renderNavi () {
    if (this.maxView >= this.maxIndex) {
      this.elSliderPrev.style.display = this.elSliderNext.style.display = 'none'
    } else {
      this.elSliderPrev.style.display = this.allowPrev() ? 'block' : 'none'
      this.elSliderNext.style.display = this.allowNext() ? 'block' : 'none'
    }
  }
}
