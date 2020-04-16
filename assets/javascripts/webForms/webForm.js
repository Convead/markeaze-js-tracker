import Liquid from '../libs/liquid.min'
import domEvent from '../libs/domEvent'
import SimpleValidation from '../libs/simpleValidation.coffee'
import FormToObject from '../libs/formToObject'
import helpers from '../helpers'
import eEmit from '../libs/eEmit'
import Slider from './slider'

const liquid = new Liquid()

export default class WebForm {
  constructor (options, elContainer) {
    this.options = options
    this.uid = options.uid
    this.currentState = options.currentState || (options.states && options.states[0]) || 'default'
    this.canBeHidden = options.can_be_hidden
    this.ribbon_label = options.ribbon_label
    this.animationDelay = 250

    this.elContainer = elContainer

    this.callbacks = {
      after_submit () {
        this.changeState('thank_you')
      }
    }
    // Convert callbacks strings to functions and merge
    for (const name in options.callbacks) {
      this.callbacks[name] = function() {
        eval(options.callbacks[name])
      }
    }

    this.slider = new Slider()

    // Sets the class name for the appearance animation. Locks animation when status changes.
    this.options.show_animation = true
    this.options.close_animation = false
    this.render()
  }
  show () {
    this.fire('before_show')
    this.sendEvent('WebFormShow', {web_form_uid: this.uid})
    this.fire('after_show')
  }
  click () {
    this.fire('before_click')
    this.sendEvent('WebFormClick', {web_form_uid: this.uid})
    this.fire('after_click')
  }
  submit (payload, visitor) {
    if (this.options.close_animation) return false
    this.fire('before_submit')
    if (!this.valid()) return false
    this.canBeHidden = false
    this.sendEvent('WebFormSubmit', Object.assign(payload, {web_form_uid: this.uid, web_form_data: visitor}))
    this.fire('after_submit')
  }
  close (disableCloseEvent = false) {
    if (this.options.close_animation) return false
    this.fire('before_close')
    if (this.canBeHidden && this.currentState === 'default') this.hide()
    else {
      if (this.currentState === 'default' && !disableCloseEvent) this.sendEvent('WebFormClose', {web_form_uid: this.uid})
      this.destroy(true)
    }
    this.fire('after_close')
  }
  hide () {
    this.fire('before_hide')
    if (this.canBeHidden) {
      this.options.is_hidden = true
      this.render()
    }
    else this.destroy(true)
    this.fire('after_hide')
  }
  destroy (animation) {
    if (animation === true) {
      this.options.show_animation = false
      this.options.close_animation = true
      this.render()
      setTimeout(() => {
        this.fire('before_destroy')
        this.el.parentNode.removeChild(this.el)
        this.fire('after_destroy')
      }, this.animationDelay)
    } else {
      this.fire('before_destroy')
      this.el.parentNode.removeChild(this.el)
      this.fire('after_destroy')
    }
  }
  changeTemplate (template) {
    this.options.body_html = template
    this.render()
  }
  changeState (state) {
    this.options.show_animation = false
    this.currentState = state
    this.render()
  }
  copyToClipboard (text) {
    if (!navigator.clipboard) {
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()

      try {
        document.execCommand('copy')
      } catch (err) {
        console.error(err)
      }

      document.body.removeChild(textArea)
      return
    }
    navigator.clipboard.writeText(text).then(function() {}, function(err) {
      console.error( err)
    })
  }
  async render () {
    const data = Object.assign(this.options, {
      state: this.currentState
    })
    const html = await liquid.parseAndRender(this.options.body_html, data)
    if (this.el) this.el.parentNode.removeChild(this.el)
    this.el = helpers.appendHTML(this.elContainer, html)
    this.elOverlay = this.el.querySelector('.mkz-js-overlay')
    this.elClose = this.el.querySelector('.mkz-js-close')
    this.elWorkarea = this.el.querySelector('.mkz-js-workarea')

    if (!this.options.is_hidden && this.currentState === 'default') this.show()

    if (this.elOverlay) domEvent.add(this.elOverlay, 'click', () => { this.close() })
    if (this.elClose) domEvent.add(this.elClose, 'click', () => { this.close() })

    const actionEls = this.elWorkarea.querySelectorAll('[role]')
    for (const actionEl of actionEls) {
      const callbackNames = actionEl.getAttribute('role').split(' ')
      domEvent.add(actionEl, 'click', () => {
        for (const callbackName of callbackNames) switch(callbackName) {
          case 'submit':
            this.submit(this.formData())
            break
          case 'copyToClipboard':
            // Replacing text when press the copy button
            const elLabel = actionEl.dataset.success ? actionEl : actionEl.querySelector('[data-success]')
            if (elLabel) {
              if (!elLabel.dataset.default) elLabel.dataset.default = elLabel.innerHTML
              elLabel.innerHTML = elLabel.dataset.success
              setTimeout(() => {
                if (elLabel) elLabel.innerHTML = elLabel.dataset.default
              }, 1000)
            }
            this.copyToClipboard(actionEl.dataset.text)
            return false
          default:
            if (typeof this[callbackName] === 'function') this[callbackName]()
            else this.fire(callbackName)
        }
      })
    }

    this.slider.setContainer(this.el)
  }
  sendEvent (eventName, payload, visitor) {
    mkz(`track${eventName}`, payload, undefined, visitor)
  }
  on (callbackName, callback) {
    this.callbacks[callbackName] = callback
  }
  fire (callbackName, payload) {
    const callback = this.callbacks[callbackName]
    eEmit.emit(`WebForm.${callbackName}`, {uid: this.uid})
    if (callback) callback.apply(this, payload)
  }
  valid () {
    return (new SimpleValidation(this.elWorkarea)).valid()
  }
  animate (options) {
    return helpers.animate(options)
  }
  formData () {
    return new FormToObject(this.elWorkarea)
  }
}
