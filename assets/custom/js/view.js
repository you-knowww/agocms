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
      zoom: 11,
      center: [-122.261, 44.6823]
    });

    // add feature sources and layers
    map.once('load', () => {
      // maps initial bounds to build first queries
      const initBnds = map.getBounds();

      // maplibre bounds to turf bbox to geojson poly
      const mapEnv = {xmin: initBnds._sw.lng, ymin: initBnds._sw.lat,
                      xmax: initBnds._ne.lng, ymax: initBnds._ne.lat,
                      spatialReference: { wkid: 4326 }};

      // get all data models before adding to map
      Promise.all(conf.map.layers.map(lrConf =>
        // return after getting layer dm and initial visible features as geojson
        new Promise((res, rej) =>
          Promise.all(
            [ new Promise((resDm, rejDm) => agocms.getDm(lrConf.url).then(dm => {
                // add ref and resolve
                lrConf.dm = dm;
                resDm();
              })),
              // query features relevent in map extent and put on map
              new Promise((resF, rejF) =>
                agocms.ajx(arcgisRest.queryFeatures,
                  { url: lrConf.url, f: 'geojson',
                    // where: renderer.field1 + '=null',
                    geometryType: 'esriGeometryEnvelope',
                    spatialRel: 'esriSpatialRelIntersects',
                    geometry: mapEnv})
                .then(({features}) => {
                  console.log(features);
                  // validate features, ref for load, resolve promise
                  if(Array.isArray(features)) lrConf.features = features;
                  resF();
                })
              )
            ]).then(res))))
      .then(() => {
        console.log(conf.map.layers);
        //const mapBounds = new map.LngLatBounds();
        console.log(map);
        /*
        map.on('moveend', () => {
          // destruct map bounds to build turf-style bbox, then convert to geojson poly
          const {_sw, _ne} = map.getBounds();
          const mapExtent = turf.bboxPolygon([_sw.lng, _sw.lat, _ne.lng, _ne.lat]);
          console.log(mapExtent);
        });
        */
        // loop configured map layers
        for(const lrConf of conf.map.layers){
          // ref
          const renderer = lrConf.dm.drawingInfo.renderer;
          // check for various styles to paint all
          const hasVariousStyles = Array.isArray(renderer.uniqueValueInfos)
                                      && renderer.uniqueValueInfos.length > 0;

          // loop styles and format query specific to them
          if(hasVariousStyles){
            // add default source for null value
            const testSource = map.addSource(lrConf.display_name, {type: 'geojson',
                                  data: {type: 'FeatureCollection',
                                    features: lrConf.features}});
            console.log('source', testSource);


            /*
            // add each group using query
            for(const uniqueGroup of renderer.uniqueValueInfos){
              // make reusable group name
              const groupName = lrConf.display_name + ' - ' + uniqueGroup.label,
                    valType = typeof uniqueGroup.value;

              // add data source. parse strings into query when needed
              map.addSource(groupName, { type: 'geojson',
                  data: lrConf.url + '/query?where=' + renderer.field1 + '='
                    + (valType == 'string' ? "'" : '') + uniqueGroup.value
                    + (valType == 'string' ? "'" : '') + '&f=geojson&token='
                    + authMgr.token});

              // build unique style using util and add styled layer to map
              const logLrStyle = agoSymbolToMaplibre(groupName, groupName, uniqueGroup.symbol);
              console.log(logLrStyle);
              map.addLayer(logLrStyle);
            }
            */
          } else {
            // add source
            map.addSource(lrConf.display_name, {type: 'geojson',
              data: lrConf.url + '/query?where=1=1&f=geojson&token=' + authMgr.token});
          }

          // ref source and use map bounds as input then updateData() on each map move (moveend)?
          // add default style
          const logLrStyle = agoSymbolToMaplibre(lrConf.display_name, lrConf.display_name,
                                renderer.defaultSymbol);
          console.log(logLrStyle);
          map.addLayer(logLrStyle);
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
      break;
    case 'DashDot':
      styleConf.type = ;
      styleConf.paint = {};
      break;
    case 'DashDotDot':
      styleConf.type = ;
      styleConf.paint = {};
      break;
    case 'Dot':
      styleConf.type = ;
      styleConf.paint = {};
      break;
    case 'LongDash':
      styleConf.type = ;
      styleConf.paint = {};
      break;
    case 'LongDashDot':
      styleConf.type = ;
      styleConf.paint = {};
      break;
    case 'Null':
      styleConf.type = ;
      styleConf.paint = {};
      break;
    case 'ShortDash':
      styleConf.type = ;
      styleConf.paint = {};
      break;
    case 'ShortDashDot':
      styleConf.type = ;
      styleConf.paint = {};
      break;
    case 'ShortDashDotDot':
      styleConf.type = ;
      styleConf.paint = {};
      break;
    case 'ShortDot':
      styleConf.type = ;
      styleConf.paint = {};
      break;
    */
    case 'Solid':
      // poly
      styleConf.type = 'fill';

      styleConf.paint = { "fill-color": 'rgba(' + def.color.join() + ')' };

      // style outline
      if(def.hasOwnProperty('outline'))
        styleConf.paint['fill-outline-color'] = 'rgba(' + def.outline.color.join() + ')';
      break;
    /*
    case 'BackwardDiagonal':
      styleConf.type = ;
      styleConf.paint = {};
      break;
    // esriSFS
    case 'Cross':
      styleConf.type = ;
      styleConf.paint = {};
      break;
    case 'DiagonalCross':
      styleConf.type = ;
      styleConf.paint = {};
      break;
    case 'ForwardDiagonal':
      styleConf.type = ;
      styleConf.paint = {};
      break;
    case 'Horizontal':
      styleConf.type = ;
      styleConf.paint = {};
      break;
    case 'Vertical':
      styleConf.type = ;
      styleConf.paint = {};
      break;
    */
    // esriSMS
    case 'Circle':
      styleConf.type = 'circle';

      styleConf.paint = {
        "circle-color": 'rgba(' + def.color.join() + ')',
        "circle-radius": ['case', ['get', 'cluster'], def.size * 2, def.size]
      };

      //
      if(def.hasOwnProperty('outline')){
        styleConf.paint['circle-stroke-width'] = def.outline.width;
        styleConf.paint['circle-stroke-color'] = 'rgba(' + def.outline.color.join() + ')';
      }
      break;
    /*
    case 'Diamond':
      styleConf.type = ;
      styleConf.paint = {};
      break;
    case 'Square':
      styleConf.type = ;
      styleConf.paint = {};
      break;
    case 'Triangle':
      styleConf.type = ;
      styleConf.paint = {};
      break;
    case 'X':
      styleConf.type = ;
      styleConf.paint = {};
      break;
    */
  }

  return styleConf;
}

