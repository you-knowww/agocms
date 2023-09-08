(function ($, Drupal, drupalSettings){
  Drupal.behaviors.feature_layer_select = {
    attach: (context, settings) => {
      once('na', '.agocms-featurelayer-select-group-search', context)
        .forEach(el => {
            // search callback
            const groupSearch = () => {
              // ref
              const val = el.value;
              // build keyword search in groups with user acccess
              const q = new arcgisRest.SearchQueryBuilder()
                              .match('private').in('access')
                              .and().match(val).in('title');

              // validate token and search
              agocms.api.getToken().then(token =>
                arcgisRest.searchGroups({q, hideToken: true, params: { token },
                      sortField: 'title', maxUrlLength: 2000})
                  .then(response => console.log(response)))
            };

            // set up event listener for keyup
            el.addEventListener('keyup', Drupal.debounce(groupSearch, 700));
          });

      once('na', '.agocms-featurelayer-select-service-search', context)
        .forEach(el => {
            // search callback
            const serviceSearch = () => {
              // ref
              const val = el.value;
              // keyword search on all items filtered to Feature Services
              const q = new arcgisRest.SearchQueryBuilder()
                              .match('Feature Service').in('type')
                              .and().match(val).in('title');

              // add filter for groups here

              // validate token and search
              agocms.api.getToken().then(token =>
                arcgisRest.searchItems({q, hideToken: true, params: { token },
                      sortField: 'title', maxUrlLength: 2000})
                  .then(response => console.log(response)))
            };

            // set up event listener for keyup
            el.addEventListener('keyup', Drupal.debounce(serviceSearch, 700));
          });
    }
  };
})(jQuery, Drupal, drupalSettings);
