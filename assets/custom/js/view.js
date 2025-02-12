((drupalSettings) => {
  console.log(drupalSettings);
  console.log(agocms);

  const basemapEnum = 'arcgis/imagery';

  // get token
  agocms.reconcileToken().then(authMgr => {
    const map = new maplibregl.Map({
      container: 'agocmsMap',
      style: 'https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/styles/arcgis/imagery?token='
        + authMgr.token,
      // style: 'https://wi.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer',
      zoom: 12,
      // starting location [longitude, latitude]
      center: [-118.80543, 34.03]
    });
  });
})(drupalSettings);
