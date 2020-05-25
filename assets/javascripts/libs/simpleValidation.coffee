module.exports = class SimpleValidation
  constructor: (form, options = {}) ->
    @form = form
    @invalidClassName = options.invalidClassName || 'mkz-wf__invalid'
    @invalidParentClassName = options.invalidParentClassName || 'mkz-wf__invalid-wrap'

  valid: ->
    controls = @form.querySelectorAll('input, select, textarea')
    if controls.length
      valid = true

      for control in controls

        validItem = true

        if typeof control.value != 'undefined'
          is_required = control.hasAttribute('required')

          if control.type.toLocaleLowerCase() == 'checkbox' && is_required
            validItem = control.checked
          else
            if control.tagName.toLocaleLowerCase() == 'select' && is_required
              validItem = control.value
            else

              if control.value

                if control.type.toLocaleLowerCase() == 'email'
                  r = /^[^ @]+@[^ @]+\.[^ @]+$/i
                  validItem = r.test(control.value)

                if control.type == 'date'
                  r = /^(19|20|21)\d\d-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/i
                  validItem = r.test(control.value)

                if control.hasAttribute('integer')
                  r = /^\-?\d+$/i
                  validItem = r.test(control.value)

                if control.hasAttribute('numeric')
                  r = /^\-?\d+\.?\d*$/i
                  validItem = r.test(control.value)

              else
                if is_required
                  validItem = control.value.trim()

        if validItem
          @_removeInvalidClass(control, @invalidClassName)
          @_removeInvalidClass(control, @invalidParentClassName)
        else
          @_addInvalidClass(control, @invalidClassName)
          @_addInvalidClass(control.parentNode, @invalidParentClassName)
          valid = false

      valid
    else
      true

  _addInvalidClass: (control, class_name) ->
    return unless class_name
    class_str = " #{class_name}"
    unless (" #{control.className} ").indexOf(class_str) >= 0
      control.className += class_str

  _removeInvalidClass: (control, class_name) ->
    return unless class_name
    classes = control.className
    new_classes = classes.replace(@invalidClassName, '').trim()
    control.className = new_classes
