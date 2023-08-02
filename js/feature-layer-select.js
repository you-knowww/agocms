(function ($, Drupal, drupalSettings){
  console.log('big test yes');
  console.log('test test test');
  console.log(drupalSettings);
  Drupal.behaviors.feature_layer_select = {
    attach: (context, settings) => {
        console.log('test more');
        console.log(Drupal);
        console.log(settings);
        // alert('hello');
      }
  };
})(jQuery, Drupal, drupalSettings);
