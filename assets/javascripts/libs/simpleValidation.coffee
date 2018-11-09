module.exports = class SimpleValidation
  constructor: (form, options = {}) ->
    @form = form
    @invalid_class_name = 'mkz-invalid'
    @required_class_name = options.required_class_name || 'convead_required'
    @invalid_parent_class_name = false
    @invalid_parent_class_name = options.required_parent_class_name || 'convead_required'

  valid: ->
    controls = @form.querySelectorAll('input, select, textarea')
    if controls.length
      valid = true

      for control in controls
        
        if typeof control.value != 'undefined'

          is_required = new RegExp('(^| )' + @required_class_name + '( |$)', 'gi').test(control.className)
          
          if control.type == 'checkbox' && is_required
            if control.checked
              @_removeInvalidClass(control, @invalid_class_name)
              @_removeInvalidClass(control, @invalid_parent_class_name)
            else
              @_addInvalidClass(control, @invalid_class_name)
              @_addInvalidClass(control.parentNode, @invalid_parent_class_name)
              valid = false
          else
            r = /^[^ @]+@[^ @]+\.[^ @]+$/i
            if (is_required && !control.value.trim()) || (control.type == 'email' && control.value != '' && !r.test(control.value))
              @_addInvalidClass(control, @invalid_class_name)
              @_addInvalidClass(control.parentNode, @invalid_parent_class_name)
              valid = false
            else
              @_removeInvalidClass(control, @invalid_class_name)
              @_removeInvalidClass(control, @invalid_parent_class_name)

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
    new_classes = classes.replace(@invalid_class_name, '').trim()
    control.className = new_classes
