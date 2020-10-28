export default class SimpleValidation {
  constructor (form, options = {}) {
    this.form = form
    this.invalidClassName = options.invalidClassName || 'mkz-wf__invalid'
    this.invalidParentClassName = options.invalidParentClassName || 'mkz-wf__invalid-wrap'
  }
  valid () {
    const controls = this.form.querySelectorAll('input, select, textarea')
    if (controls.length) {
      let valid = true

      controls.forEach((control) => {
        let validItem = true

        if (typeof control.value !== 'undefined') {
          const isRequired = control.hasAttribute('required')
          const controlType = control.type.toLocaleLowerCase()

          if (controlType === 'checkbox' && isRequired) {
            validItem = control.checked
          } else {
            if (control.tagName.toLocaleLowerCase() === 'select' && isRequired) validItem = control.value
            else {
              if (control.value) {
                if (controlType === 'email') {
                  validItem = /^[^ @]+@[^ @]+\.[^ @]+$/i.test(control.value)
                }

                if (controlType == 'date') {
                  validItem = /^(19|20|21)\d\d-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/i.test(control.value)
                }

                if (control.hasAttribute('integer')) {
                  validItem = /^\-?\d+$/i.test(control.value)
                }

                if (control.hasAttribute('numeric')) {
                  validItem = /^\-?\d+\.?\d*$/i.test(control.value)
                }
              } else {
                if (isRequired) validItem = control.value.trim()
              }
            }
          }
        }

        if (validItem) {
          this.removeInvalidClass(control, this.invalidClassName)
          this.removeInvalidClass(control, this.invalidParentClassName)
        } else {
          this.addInvalidClass(control, this.invalidClassName)
          this.addInvalidClass(control.parentNode, this.invalidParentClassName)
          valid = false
        }
      })

      return valid
    } else return true
  }
  addInvalidClass (control, className) {
    if (!className) return
    const classStr = ` ${className}`
    if ((` ${control.className} `).indexOf(classStr) === -1) control.className += classStr
  }
  removeInvalidClass (control, className) {
    if (!className) return
    const classes = control.className
    const newClasses = classes.replace(this.invalidClassName, '').trim()
    control.className = newClasses
  }
}
