(function ($, Drupal, drupalSettings){
  Drupal.behaviors.feature_layer_select = {
    attach: (context, settings) => {
      // group and feature service ids for search filter
      let groupId, serviceId;

      // Drupal once element load standard. Group search field
      once('na', '.agocms-featurelayer-select-group-search', context)
        .forEach(el => {
            // datalist for populating search options for specific field using list attr
            const $el_datalist = $('#' + el.getAttribute('list'));
            // group ID -> title so user sees title but stores id
            let groupOptions = {};

            // search callback
            const groupSearch = () => {
              // ref
              const val = el.value;
              // build keyword search in groups with user acccess
              const q = new arcgisRest.SearchQueryBuilder()
                              .match('private').in('access')
                              .and().match(val).in('title');

              // validate token and search
              agocms.ajx(arcgisRest.searchGroups, {q, sortField: 'title'})
                .then(response => {
                  // clear options and add new ones
                  $el_datalist.empty();
                  groupOptions = {};

                  // loop response options and populate datalist
                  for(const group of response.results){
                    // parse group from response and convert to option
                    const el_groupOption = document.createElement('option');

                    // set display name as value and label but set
                    el_groupOption.value = group.id;
                    el_groupOption.innerHTML = group.title;

                    // add to datalist
                    $el_datalist.append(el_groupOption);
                    groupOptions[group.id] = group.title;
                  }
                })
            };

            // set change event listener for datalist selection
            el.addEventListener('input', e => {
                // ref
                const val = e.target.value;

                // validate input against datalist values
                if(groupOptions.hasOwnProperty(val)) {
                  // set group id reference
                  groupId = val;

                  // replace text in field with group title
                  el.value = groupOptions[groupId];
                } else {
                  // debounce to minimize requests
                  Drupal.debounce(groupSearch, 700)();
                }
              });
          });

      // feature service search field
      once('na', '.agocms-featurelayer-select-service-search', context)
        .forEach(el => {
            // datalist for populating search options for specific field using list attr
            const $el_datalist = $('#' + el.getAttribute('list')),
                  // get corresponding layer select
                  $el_layerSelect = $('#agocms-featurelayer-select-layer-select-'
                                      + el.getAttribute('d-field-name'));
            // service ID -> title so user sees title but stores id
            let serviceOptions = {};

            // search callback
            const serviceSearch = () => {
              // ref
              const val = el.value;
              // keyword search on all items filtered to Feature Services
              const q = new arcgisRest.SearchQueryBuilder()
                              .match('Feature Service').in('type')
                              .and().match(val).in('title');

              // if no group set, search all available feature services
              const serviceSearchFn = typeof groupId == 'undefined'
                                        ? arcgisRest.searchItems
                                        : arcgisRest.searchGroupContent;

              // run group search if groupId is set. If not, groupId ignored by api
              agocms.ajx(serviceSearchFn, {q, groupId, sortField: 'title'})
                .then(response => {
                  // clear options and add new ones
                  $el_datalist.empty();
                  serviceOptions = {};

                  // loop response options and populate datalist
                  for(const service of response.results){
                    // parse group from response and convert to option
                    const el_serviceOption = document.createElement('option');

                    // set group id as value but display name
                    el_serviceOption.value = service.id;
                    el_serviceOption.innerHTML = service.title;

                    // add to datalist
                    $el_datalist.append(el_serviceOption);
                    serviceOptions[service.id] = service.title;
                  }
                });
            };

            // set change event listener for datalist selection
            el.addEventListener('input', e => {
                // ref
                const val = e.target.value;

                // validate input against datalist values
                if(serviceOptions.hasOwnProperty(val)) {
                  // set group id reference
                  serviceId = val;

                  // replace text in field with group title
                  el.value = serviceOptions[serviceId];
                } else {
                  // debounce to minimize requests
                  Drupal.debounce(serviceSearch, 700)();
                }
              });
          });

      // layer select field
      once('na', '.agocms-featurelayer-select-service-search', context)
        .forEach(el => {
            el.addEventListener('change', e => console.log('layer:', e.target.value));
          })
    }
  };
})(jQuery, Drupal, drupalSettings);
