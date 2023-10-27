function agocmsViewConfigFormGroupSearch(searchText = ''){
  return new Promise((resolve, reject) => {
    // validate search text
    if(searchText == '') resolve([]);

    const q = new arcgisRest.SearchQueryBuilder()
                .match('private').in('access')
                .and().match(searchText).in('title');

    // validate token and search. return array. Empty on failure
    agocms.ajx(arcgisRest.searchGroups, {q, sortField: 'title'})
      .then(response =>
          resolve(Array.isArray(response.results) ? response.results : []),
        () => resolve([]));
  });
}

function agocmsViewConfigFormServiceSearch(searchText = '', groupId = ''){
  return new Promise((resolve, reject) => {
    // validate search text
    if(searchText == '' && groupId == '') resolve([]);

    // keyword search on all items filtered to Feature Services
    const q = new arcgisRest.SearchQueryBuilder()
                .match('Feature Service').in('type');

    // skip if search is empty
    if(searchText !== '') q.and().match(searchText).in('title');

    // if no group set, search all available feature services
    const searchFn = groupId == ''
                      ? arcgisRest.searchItems
                      : arcgisRest.searchGroupContent;

    // run group search if groupId is set. If not, groupId ignored by api
    agocms.ajx(searchFn, {q, groupId, sortField: 'title'})
      .then(response =>
          resolve(Array.isArray(response.results) ? response.results : []),
        () => resolve([]));
  })
}
