const Liquid = require('../libs/liquid.min')
const liquid = new Liquid()
const domEvent = require('../libs/domEvent')
const SimpleValidation = require('../libs/simpleValidation.coffee')
const FormToObject = require('../libs/formToObject')
const helpers = require('../helpers')
const eEmit = require('../libs/eEmit')

export default class WebForm {
  constructor (options, elContainer) {
    this.options = options
    this.id = options.id
    this.currentState = options.currentState || 'default'
    this.type = options.display_type
    this.canBeHidden = options.can_be_hidden
    this.ribbon_label = options.ribbon_label

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

    // Sets the class name for the appearance animation. Locks animation when status changes.
    this.options.is_animated = true
    this.render()
  }
  show () {
    this.fire('before_show')
    this.sendEvent('WebFormShow', {web_form_id: this.id})
    this.fire('after_show')
  }
  click () {
    this.fire('before_click')
    this.sendEvent('WebFormClick', {web_form_id: this.id})
    this.fire('after_click')
  }
  submit (payload, visitor) {
    this.fire('before_submit')
    if (!this.valid()) return false
    this.canBeHidden = false
    this.sendEvent('WebFormSubmit', Object.assign(payload, {web_form_id: this.id}), visitor)
    this.fire('after_submit')
  }
  close () {
    this.fire('before_close')
    if (this.canBeHidden && this.currentState === 'default') this.hide()
    else {
      if (this.currentState === 'default') this.sendEvent('WebFormClose', {web_form_id: this.id})
      this.destroy()
    }
    this.fire('after_close')
  }
  hide () {
    this.fire('before_hide')
    if (this.canBeHidden) {
      this.options.is_hidden = true
      this.render()
    }
    else this.destroy()
    this.fire('after_hide')
  }
  destroy () {
    this.fire('before_destroy')
    this.el.parentNode.removeChild(this.el)
    this.fire('after_destroy')
  }
  changeTemplate (template) {
    this.options.body_html = template
    this.render()
  }
  changeState (state) {
    this.options.is_animated = false
    this.currentState = state
    this.render()
  }
  async render () {
    const data = Object.assign(this.options, {
      state: this.currentState,
      wrap_styles: helpers.objectToStyles(this.options.settings.wrap_styles),
      content_styles: helpers.objectToStyles(this.options.settings.content_styles)
    })
    const html = await liquid.parseAndRender(this.options.body_html, data)
    if (this.el) this.el.parentNode.removeChild(this.el)
    this.el = helpers.appendHTML(this.elContainer, html)
    this.elOverlay = this.el.querySelector('.mkz-js-overlay')
    this.elClose = this.el.querySelector('.mkz-js-close')
    this.elWorkarea = this.el.querySelector('.mkz-js-workarea')

    if (!this.options.is_hidden && this.currentState === 'default') this.show()

    domEvent.add(this.elOverlay, 'click', () => { this.close() })
    domEvent.add(this.elClose, 'click', () => { this.close() })

    const actionEls = this.elWorkarea.querySelectorAll('[role]')
    for (const actionEl of actionEls) {
      const callbackName = actionEl.getAttribute('role')
      domEvent.add(actionEl, 'click', () => {
        if (callbackName === 'submit') {
          this.submit(this.formData())
        } else {
          if (typeof this[callbackName] === 'function') this[callbackName]()
          else this.fire(callbackName)
        }
      })
    }
  }
  sendEvent (eventName, payload, visitor) {
    mkz(`track${eventName}`, payload, undefined, visitor)
  }
  on (callbackName, callback) {
    this.callbacks[callbackName] = callback
  }
  fire (callbackName, payload) {
    const callback = this.callbacks[callbackName]
    eEmit.emit(`WebForm.${callbackName}`, {id: this.id})
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
