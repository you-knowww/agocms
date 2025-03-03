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
    }),
          data = {map: [], tables: []};

    // maps initial bounds to build first queries
    const mapBounds = map.getBounds();

    // maplibre bounds to turf bbox to geojson poly
    const mapPoly = turf.bboxPolygon([mapBounds._sw.lng, mapBounds._sw.lat,
                      mapBounds._ne.lng, mapBounds._ne.lat]);
    let mapGeo = ArcgisToGeojsonUtils.geojsonToArcGIS(mapPoly.geometry);

    // track last time map was updated with timestamp
    let lastMapUpdate = new Date();

    // add feature sources and layers
    map.once('load', () => {
      // get all data models before adding to map
      Promise.all(conf.map.layers.map(layerConf =>
        // get dm then get all data before loading to map
        new Promise((res, rej) => agocms.getDm(layerConf.url).then(dm => {
          // add ref to layer config and data
          layerConf.dm = dm;
          const layerData = {url: layerConf.url, groups: []};

          // add layer data to ref
          data.map.push(layerData);

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
                        // create group and add feature ref
                        layerData.groups.push({features});
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
                        // create group and add coded value domain ref
                        layerData.groups.push({unique_value: value, label, features});
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
                // create group and add feature ref
                layerData.groups.push({features});
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
          console.log(data.map);
          // ref
          const renderer = layerConf.dm.drawingInfo.renderer,
                layerData = data.map.find(l => l.url == layerConf.url);

          // try to get default source
          const defaultDataGroup = layerData.groups.find(g => !g.hasOwnProperty('unique_value'));

          // if default add to map
          if(typeof defaultDataGroup !== 'undefined'){
            // add default source for null value
            const testSource = map.addSource(layerConf.display_name, {type: 'geojson',
                                  data: {type: 'FeatureCollection',
                                    features: defaultDataGroup.features }});

            // add default style
            map.addLayer(agoSymbolToMaplibre(layerConf.display_name, layerConf.display_name,
                renderer.defaultSymbol));
          }

          // check for various styles to paint all
          if(Array.isArray(renderer.uniqueValueInfos) && renderer.uniqueValueInfos.length > 0){
            // ** ref source and use map bounds as input then updateData() on each map move (moveend)?
            // add each group using query
            for(const {label, value, symbol} of renderer.uniqueValueInfos){
              // find and validate data group
              const dataGroup = layerData.groups.find(g => g.unique_value == value);

              // validate data group before adding
              if(typeof dataGroup !== 'undefined'){
                // make reusable group name
                const groupName = layerConf.display_name + ' - ' + label

                // add data source. parse strings into query when needed
                map.addSource(groupName, { type: 'geojson',
                    data: {type: 'FeatureCollection', features: dataGroup.features}});

                // build uniq e style using util and add styled layer to map
                map.addLayer(agoSymbolToMaplibre(groupName, groupName, symbol));
              }
            }
          }
        }
      });
    });

    // pass layer url and filters as object array:
    // [{field: "field", value: "val"}, {field: "field", value: 4}]
    function getFeaturesInMap(url, filters = []){
      // make query config
      const qConf = { url, f: 'geojson',
                      spatialRel: 'esriSpatialRelIntersects',
                      geometryType: 'esriGeometryPolygon',
                      geometry: mapGeo };

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

