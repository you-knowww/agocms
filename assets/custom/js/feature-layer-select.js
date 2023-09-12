(function ($, Drupal, drupalSettings){
  Drupal.behaviors.feature_layer_select = {
    attach: (context, settings) => {
      // group and feature service ids for search filter
      let groupId, serviceId;

      // Drupal once element load standard
      once('na', '.agocms-featurelayer-select-group-search', context)
        .forEach(el => {
            // datalist for populating search options for specific field using list attr
            const $el_datalist = $('#' + el.getAttribute('list'));
                  // group ID -> title so user gets readable title but id is stored in-case dupe titles
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
              agocms.api.getToken().then(token =>
                arcgisRest.searchGroups({q, hideToken: true, params: { token },
                      sortField: 'title', maxUrlLength: 2000})
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
                  }))
            };

            // set up event listener for keyup
            el.addEventListener('keyup', Drupal.debounce(groupSearch, 700));

            // set change event listener for datalist selection
            el.addEventListener('change', e => {
                // save contextual ref then update value to human readable
                groupId = e.target.value;
                console.log(groupId, groupOptions);

                el.value = groupOptions[groupId];
              });
          });

      once('na', '.agocms-featurelayer-select-service-search', context)
        .forEach(el => {
            // datalist for populating search options for specific field using list attr
            const $el_datalist = $('#' + el.getAttribute('list'));

            $el_datalist.bind('click', e => console.log('service: ', e));

            // search callback
            const serviceSearch = () => {
              // ref
              const val = el.value;
              // keyword search on all items filtered to Feature Services
              const q = new arcgisRest.SearchQueryBuilder()
                              .match('Feature Service').in('type')
                              .and().match(val).in('title');

              // validate token and search
              agocms.api.getToken().then(token => {
                  // if no group set, search all available feature services
                  const serviceSearch = typeof groupId == 'undefined'
                                        ? arcgisRest.searchItems
                                        : arcgisRest.searchGroupContent;

                  // run search. groupId is ignore if unused in call
                  serviceSearch({q, groupId, sortField: 'title',
                        hideToken: true, params: { token }, maxUrlLength: 2000})
                    .then(response => {
                      // clear options and add new ones
                      $el_datalist.empty();

                      // loop response options and populate datalist
                      for(const group of response.results){
                        // parse group from response and convert to option
                        const el_groupOption = document.createElement('option');

                        // set group id as value but display name
                        el_groupOption.value = group.id;
                        el_groupOption.innerHTML = group.title;

                        // add to datalist
                        $el_datalist.append(el_groupOption);
                      }
                    });
                })
            };

            // set up event listener for keyup
            el.addEventListener('keyup', Drupal.debounce(serviceSearch, 700));
          });
    }
  };
})(jQuery, Drupal, drupalSettings);
