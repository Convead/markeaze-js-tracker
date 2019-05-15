module.exports = class SimpleValidation
  constructor: (form, options = {}) ->
    @form = form
    @invalidClassName = 'mkz-wf__invalid'
    @invalidParentClassName = options.requiredParentClassName || 'mkz-wf__invalid-wrap'

  valid: ->
    controls = @form.querySelectorAll('input, select, textarea')
    if controls.length
      valid = true

      for control in controls
        
        if typeof control.value != 'undefined'

          is_required = control.hasAttribute('required')
          
          if control.type == 'checkbox' && is_required
            if control.checked
              @_removeInvalidClass(control, @invalidClassName)
              @_removeInvalidClass(control, @invalidParentClassName)
            else
              @_addInvalidClass(control, @invalidClassName)
              @_addInvalidClass(control.parentNode, @invalidParentClassName)
              valid = false
          else
            r = /^[^ @]+@[^ @]+\.[^ @]+$/i
            if (is_required && !control.value.trim()) || (control.type == 'email' && control.value != '' && !r.test(control.value))
              @_addInvalidClass(control, @invalidClassName)
              @_addInvalidClass(control.parentNode, @invalidParentClassName)
              valid = false
            else
              @_removeInvalidClass(control, @invalidClassName)
              @_removeInvalidClass(control, @invalidParentClassName)

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
