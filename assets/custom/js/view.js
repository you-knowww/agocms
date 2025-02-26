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

    // maps initial bounds to build first queries
    const mapBounds = map.getBounds();

    // maplibre bounds to turf bbox to geojson poly
    const mapEnv = {xmin: mapBounds._sw.lng, ymin: mapBounds._sw.lat,
                    xmax: mapBounds._ne.lng, ymax: mapBounds._ne.lat,
                    spatialReference: { wkid: 4326 }};

    // add feature sources and layers
    map.once('load', () => {
      // get all data models before adding to map
      Promise.all(conf.map.layers.map(layerConf =>
        // get dm then get all data before loading to map
        new Promise((res, rej) => agocms.getDm(layerConf.url).then(dm => {
          // add ref to layer config and features
          layerConf.dm = dm;
          layerConf.features = {};

          // ref
          const renderer = dm.drawingInfo.renderer;

          // check for various styles to fetch all variants
          if(Array.isArray(renderer.uniqueValueInfos)
              && renderer.uniqueValueInfos.length > 0){
            // promise array to get all data before adding to map
            const itemsToFetch = [];

            // start with a default value
            if(renderer.hasOwnProperty('defaultSymbol')) {
              itemsToFetch.push(
                new Promise((resolve, reject) =>
                  // query features in map extent when distinct field is null
                  getFeaturesInMap(layerConf.url, [{field: renderer.field1, value: null}])
                    .then(features => {
                        // set features and mark promise resolved
                        layerConf.features[layerConf.display_name] = features;
                        resolve();
                      },
                      () => {
                        // error out and mark promise rejected
                        console.error('invalid request');
                        reject();
                      })));
            }

            // check for unique vals and query each
            for(const {label, value} of renderer.uniqueValueInfos){
              itemsToFetch.push(
                new Promise((resolve, reject) =>
                  // query features in map extent when distinct field is null
                  getFeaturesInMap(layerConf.url, [{field: renderer.field1, value}])
                    .then(features => {
                        // set features and mark promise resolved
                        layerConf.features[layerConf.display_name + ' - ' + label] = features;
                        resolve();
                      },
                      () => {
                      // error out and mark promise rejected
                        console.error('invalid request');
                        reject();
                      })));
            }

            // get all variants before adding to map
            Promise.all(itemsToFetch).then(res, rej);
          } else {
            // query features in map extent with no filter
            getFeaturesInMap(layerConf.url).then(
              features => {
                // set features and mark promise resolved
                layerConf.features[layerConf.display_name] = features;
                res();
              },
              () => {
                // error out and mark promise rejected
                console.error('invalid request')
                rej();
              }
            )
          }
        }))))
      .then(() => {
        console.log('done processing?');
        // console.log(conf.map.layers);
        //const mapBounds = new map.LngLatBounds();
        // console.log(map);
        /*
        map.on('moveend', () => {
          // destruct map bounds to build turf-style bbox, then convert to geojson poly
          const {_sw, _ne} = map.getBounds();
          const mapExtent = turf.bboxPolygon([_sw.lng, _sw.lat, _ne.lng, _ne.lat]);
          console.log(mapExtent);
        });
        */
        // loop configured map layers
        for(const layerConf of conf.map.layers){
          // ref
          const renderer = layerConf.dm.drawingInfo.renderer;

          // check for various styles to paint all
          if(Array.isArray(renderer.uniqueValueInfos)
              && renderer.uniqueValueInfos.length > 0){
            // add default source for null value
            const testSource = map.addSource(layerConf.display_name, {type: 'geojson',
                                  data: {type: 'FeatureCollection',
                                    features: layerConf.features[layerConf.display_name]}});
            // console.log('source', testSource);

            // add each group using query
            for(const {label, symbol} of renderer.uniqueValueInfos){
              // make reusable group name
              const groupName = layerConf.display_name + ' - ' + label;

              // add data source. parse strings into query when needed
              map.addSource(groupName, { type: 'geojson',
                  data: {type: 'FeatureCollection', features: layerConf.features[groupName]}});

              // build unique style using util and add styled layer to map
              const logLrStyleUniq = agoSymbolToMaplibre(groupName, groupName, symbol);
              // console.log(logLrStyleUniq);
              map.addLayer(logLrStyleUniq);
            }
          }

          // ref source and use map bounds as input then updateData() on each map move (moveend)?
          // add default style
          const logLrStyle = agoSymbolToMaplibre(layerConf.display_name, layerConf.display_name,
                                renderer.defaultSymbol);
          // console.log(logLrStyle);
          map.addLayer(logLrStyle);
        }
      });
    });

    // pass layer url and filters as object array:
    // [{field: "field", value: "val"}, {field: "field", value: 4}]
    function getFeaturesInMap(url, filters = []){
      // make query config
      const qConf = { url, f: 'geojson',
                      geometryType: 'esriGeometryEnvelope',
                      spatialRel: 'esriSpatialRelIntersects',
                      geometry: mapEnv };

      // check for filters
      if(filters.length > 0){
        // build where clause from filters. ternary in parser places quotes around strings
        qConf.where = filters.map(({field, value}) =>
                        field + '=' + (typeof value == 'string' ? "'" + value + "'" : value))
                      .join(' AND ');
      }

      return new Promise((res, rej) =>
        agocms.ajx(arcgisRest.queryFeatures, qConf).then(({features}) => {
          // validate features, ref for load, resolve promise
          if(Array.isArray(features)) res(features);
          else rej();
        }));
    }
  });
})(drupalSettings);

// pass an maplibre id, display name, and arcgis symbol def
function agoSymbolToMaplibre(id, source, def){
  // out
  const styleConf = {id, source};

  // console.log(def);

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

