(function ($, Drupal, drupalSettings){
    // alert('hello');
    import { request } from '@esri/arcgis-rest-request';

    const url = "https://www.arcgis.com/sharing/rest/content/items/6e03e8c26aad4b9c92a87c1063ddb0e3/data";

    request(url)
        .then(response => {
            console.log(response) // WebMap JSON
        });
  }})(jQuery, Drupal, drupalSettings);
