function agocmsViewConfigFormGroupSearch(searchText){
  return new Promise((resolve, reject) => {
    // validate search text
    if(searchText == '') resolve([]);

    const q = new arcgisRest.SearchQueryBuilder()
                .match('private').in('access')
                .and().match(searchText).in('title');

    // validate token and search. return array. Empty on failure
    agocms.ajx(arcgisRest.searchGroups, {q, sortField: 'title'})
      .then(response => {
          // validate respond with array of results or empty array
          resolve(Array.isArray(response.results) ? response.results : []);
        },
        () => resolve([]));
  });
}
