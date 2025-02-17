((drupalSettings) => {
  const conf = drupalSettings.agocms.conf;
  console.log(conf);

  const basemapEnum = 'arcgis/imagery';

  // get token
  agocms.reconcileToken().then(authMgr => {
    const map = new maplibregl.Map({
      container: 'agocmsMap',
      style: 'https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/styles/arcgis/imagery?token='
        + authMgr.token,
      zoom: 12,
      center: [-118.80543, 34.03]
    });

    // add feature sources and layers
    map.once('load', () => {
      // get all data models before adding to map
      Promise.all(conf.map.layers.map(lrConf =>
        new Promise((res, rej) => agocms.getDm(lrConf.url).then(dm => {
          // add ref and resolve
          lrConf.dm = dm;
          res();
        }))))
      .then(() => {
        console.log(conf.map.layers);
        // loop configured map layers
        for(const lrConf of conf.map.layers){
          // add source
          map.addSource(lrConf.display_name, {type: 'geojson',
            data: lrConf.url + '/query?where=1=1&f=geojson&token=' + authMgr.token});

          // ref source and use map bounds as input then updateData() on each map move (moveend)?

          map.addLayer(agoSymbolToMaplibre(lrConf.display_name, lrConf.display_name,
            lrConf.dm.drawingInfo.renderer.defaultSymbol));
          /*
            // convert drawing info to maplibregl conf
            switch(lrConf.dm.geometryType){
              case 'esriGeometryPolygon':
              case 'esriGeometryEnvelope':
                const styleConf = {
                  type: 'fill'
                };
                break;
              case 'esriGeometryPoint':
              case 'esriGeometryMultipoint':
                const styleConf = {
                  type: 'fill'
                };
                break;
              case 'esriGeometryPolyline':
                const styleConf = {
                  type: 'line'
                };
                break;
            }
          */
        }
      });
    });
  });
})(drupalSettings);

// pass an maplibre id, display name, and arcgis symbol def
function agoSymbolToMaplibre(id, source, def){
  // out
  const styleConf = {id, source};

  console.log(def);

  // remove type from style to get uniform style descriptions
  switch(def.style.substring(def.type.length)){
    // esriSLS
    /*
    case 'Dash':
      styleConf.type = ;
      styleConf.paint = {};
    case 'DashDot':
      styleConf.type = ;
      styleConf.paint = {};
    case 'DashDotDot':
      styleConf.type = ;
      styleConf.paint = {};
    case 'Dot':
      styleConf.type = ;
      styleConf.paint = {};
    case 'LongDash':
      styleConf.type = ;
      styleConf.paint = {};
    case 'LongDashDot':
      styleConf.type = ;
      styleConf.paint = {};
    case 'Null':
      styleConf.type = ;
      styleConf.paint = {};
    case 'ShortDash':
      styleConf.type = ;
      styleConf.paint = {};
    case 'ShortDashDot':
      styleConf.type = ;
      styleConf.paint = {};
    case 'ShortDashDotDot':
      styleConf.type = ;
      styleConf.paint = {};
    case 'ShortDot':
      styleConf.type = ;
      styleConf.paint = {};
    */
    case 'Solid':
      // poly
      styleConf.type = 'fill';

      styleConf.paint = { "circle-color": 'rgba(' + def.color.join() + ')' };

      //
      if(def.hasOwnProperty('outline')){
        styleConf.paint = {
          "circle-stroke-width": def.outline.width,
          "circle-stroke-color": 'rgba(' + def.color.join() + ')'
        };
      }
    /*
    case 'BackwardDiagonal':
      styleConf.type = ;
      styleConf.paint = {};
    // esriSFS
    case 'Cross':
      styleConf.type = ;
      styleConf.paint = {};
    case 'DiagonalCross':
      styleConf.type = ;
      styleConf.paint = {};
    case 'ForwardDiagonal':
      styleConf.type = ;
      styleConf.paint = {};
    case 'Horizontal':
      styleConf.type = ;
      styleConf.paint = {};
    case 'Vertical':
      styleConf.type = ;
      styleConf.paint = {};
    */
    // esriSMS
    case 'Circle':
      styleConf.type = 'circle';

      styleConf.paint = {
        "circle-color": 'rgba(' + def.color.join() + ')',
        "circle-radius": ['case', ['get', 'cluster'], def.size * 2, def.size]
      }

      //
      if(def.hasOwnProperty('outline')){
        styleConf.paint = {
          "circle-stroke-width": def.outline.width,
          "circle-stroke-color": 'rgba(' + def.color.join() + ')'
        };
      }
    /*
    case 'Diamond':
      styleConf.type = ;
      styleConf.paint = {};
    case 'Square':
      styleConf.type = ;
      styleConf.paint = {};
    case 'Triangle':
      styleConf.type = ;
      styleConf.paint = {};
    case 'X':
      styleConf.type = ;
      styleConf.paint = {};
    */
  }

  return styleConf;
}

