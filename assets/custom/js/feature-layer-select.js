(function ($, Drupal, drupalSettings){
  Drupal.behaviors.feature_layer_select = {
    attach: (context, settings) => {
      // group and feature service ids for search filter
      let groupId,
          serviceUrl;

      // Drupal once element load standard. Group search field
      once('na', '.agocms-featurelayer-select-group-search', context)
        .forEach(el => {
            // datalist for populating search options for specific field using list attr
            const $el_datalist = $('#' + el.getAttribute('list')),
                  // get corresponding service select
                  $el_serviceInput = $('#agocms-featurelayer-select-service-input-'
                                        + el.getAttribute('d-field-name')),
                  // get corresponding layer select
                  $el_layerSelect = $('#agocms-featurelayer-select-layer-select-'
                                      + el.getAttribute('d-field-name'));
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

                  // clear selected service url ref
                  serviceUrl = undefined;

                  // reset layer select options
                  $el_layerSelect.empty();

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
            // jquery ref
            const $el = $(el);
            // datalist for populating search options for specific field using list attr
            const $el_datalist = $('#' + $el.attr('list')),
                  // get corresponding layer select
                  $el_layerSelect = $('#agocms-featurelayer-select-layer-select-'
                                        + $el.attr('d-field-name'));
            // service ID -> title so user sees title but stores id
            let serviceOptions = {};

            // search callback
            const serviceSearch = () => {
              // ref
              const val = el.value;
              // keyword search on all items filtered to Feature Services
              const q = new arcgisRest.SearchQueryBuilder()
                              .match('Feature Service').in('type');

              // skip if group selected and search is empty
              if(typeof groupId == 'undefined' || val !== ''){
                q.and().match(val).in('title');
              }

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
                  // clear selected service url ref
                  serviceUrl = undefined;

                  // loop response options and populate datalist
                  for(const service of response.results){
                    // parse group from response and convert to option
                    const el_serviceOption = document.createElement('option');

                    // set group id as value but display name
                    el_serviceOption.value = service.url;
                    el_serviceOption.innerHTML = service.title;

                    // add to datalist
                    $el_datalist.append(el_serviceOption);
                    serviceOptions[service.url] = service.title;
                  }
                });
            };

            // set change event listener for datalist selection
            $el.bind('input', e => {
                // ref
                const val = e.target.value;

                // validate input against datalist values
                if(serviceOptions.hasOwnProperty(val)) {
                  // replace text in field with group title
                  $el.val(serviceOptions[val]);
                  // update service url ref
                  serviceUrl = val;

                  // get layers in feature service
                  agocms.ajx(arcgisRest.getAllLayersAndTables, {url: val})
                    .then(response => {
                      // clear options and add new ones
                      $el_layerSelect.empty();

                      // validate
                      if(response.hasOwnProperty('error')){
                        console.error('FAILURE: service layers.')
                      } else {
                        // add dummy select option
                        const el_defaultOpt = document.createElement('option');
                        el_defaultOpt.innerHTML = 'Select a layer';
                        el_defaultOpt.setAttribute('selected', 'selected');
                        el_defaultOpt.setAttribute('disabled', 'disabled');
                        // add as first option
                        $el_layerSelect.append(el_defaultOpt);

                        // loop responses and add options
                        for(const [groupName, group] of Object.entries(response)){
                          // validate
                          if(Array.isArray(group) && group.length > 0){
                            // build option group for layers
                            const el_layerGroup = document.createElement('optgroup');

                            // set group label with capitol first letter
                            el_layerGroup.setAttribute('label',
                                groupName.charAt(0).toUpperCase() + groupName.slice(1) + ': ');

                            // loop layers and populate select input
                            for(const layer of group){
                              // parse group from response and convert to option
                              const el_layerOption = document.createElement('option');

                              // set group id as value but display name
                              el_layerOption.value = layer.id;
                              el_layerOption.innerHTML = layer.name;

                              // add to option group
                              el_layerGroup.appendChild(el_layerOption);
                            }

                            // add layer option group to select
                            $el_layerSelect.append(el_layerGroup);
                          }
                        }
                      }
                    });
                } else {
                  // debounce to minimize requests
                  Drupal.debounce(serviceSearch, 700)();
                }
              });

            // run service search on click to open datalist instantly
            $el.bind('focus', serviceSearch);
          });

      // layer select field
      once('na', '.agocms-featurelayer-select-layer-select', context)
        .forEach(el => {
            // jquery ref
            const $el = $(el);
            // input event listener
            $el.bind('input', e => {
              // get main input field and input layer URL
              const $el_urlInput = $('#agocms-featurelayer-select-input-'
                                      + $el.attr('d-field-name'));
              $el_urlInput.val(serviceUrl + '/' + $el.val());

              // fire input event for listeners
              $el_urlInput.trigger('input');
            });
          })
    }
  };
})(jQuery, Drupal, drupalSettings);
