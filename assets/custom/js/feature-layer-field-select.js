(function ($, Drupal, drupalSettings){
  Drupal.behaviors.feature_layer_field_select = {
    attach: (context, settings) => {
      // layer select field
      once('na', '.agocms-featurelayer-field-datalist', context)
        .forEach(el => {
            // jquery
            const $el = $(el);
            // get form field name
            const formField = $el.attr('d-field-name');
            // get input for datalist
            const $el_listInput = $('input[list="' + $el.attr('id') + '"');
            // layer url reference
            let layerUrl = '';

            // add select event listener related feature layer select field
            $('#agocms-featurelayer-select-input-' + formField).bind('input', e => {
              // get layer url
              layerUrl = e.target.value;
            });

            // run search on focus to prompt immediate open
            $el_listInput.bind('focus', () => {
              // clear datalist
              $(el).empty();

              // look up fields in layer
              agocms.ajx(arcgisRest.getLayer, {url: layerUrl})
                .then(response => {
                  // validate fields in result
                  if(Array.isArray(response.fields)){
                    // loop fields to add datalist option for each
                    for(const field of response.fields){
                      // create data list option and add value and text
                      const el_option = document.createElement('option');
                      el_option.value = field.name;
                      el_option.innerHTML = field.name;
                      // add to datalist
                      $el.append(el_option);
                    }
                  } else {
                    // show error
                    console.error('No fields in datalist');
                  }
                });
            })
          })
    }
  };
})(jQuery, Drupal, drupalSettings);
