(function (Drupal, drupalSettings){
  console.log('pretest');
  arcgisRest
    .getSelf(
      { hideToken: true,
        params: { token: drupalSettings.ago_access_token.access_token }})
    .then(response => console.log(response));
  const testQ = new arcgisRest.SearchQueryBuilder().match('private').in('access');
  console.log(testQ)
  arcgisRest
    .searchGroups(
      { q: testQ,
        hideToken: true,
        params: { token: drupalSettings.ago_access_token.access_token }})
    .then(response => console.log(response));
})(Drupal, drupalSettings);
