// define web component for fields
customElements.define(
  'agocms-config-field',
  class extends HTMLElement {
    constructor() {
      super();
      const tpl = document.getElementById("agocmsFeatureLayerSelectField");

      const shadowRoot = this.attachShadow({ mode: "open" });
      shadowRoot.appendChild(tpl.content.cloneNode(true));
    }
  });

function agocmsViewConfigAddLayer() {
  // get template and container
  const tpl_layerForm = document.getElementById('agocmsFeatureLayerSelect'),
        el_layerContainer = document.getElementById('agocmsViewMapConfLayers');

  // get existing list count. clone form as element
  const layerCnt = el_layerContainer.children.length,
        el_layerForm = document.importNode(tpl_layerForm.content, true);

  // find datalist and their input to update ID and ref to layer specific
  el_layerForm.querySelectorAll('datalist').forEach(el_datalist => {
    // ref input for datalist
    const el_input = el_layerForm.querySelector('input[list="'+ el_datalist.id +'"');

    // update datalist id to unique val and ref in list attrib
    el_datalist.id = el_datalist.id + layerCnt;
    el_input.setAttribute('list', el_datalist.id);
  })

  // make hyperscript el refs before appending to container
  const els_hypserscripters = el_layerForm.querySelectorAll('[\_]');

  // get container and add template content to it. wonder if this works with hypertext
  el_layerContainer.appendChild(el_layerForm);

  // apply hyperscript on necessary els. the fun times.
  els_hypserscripters.forEach(el => _hyperscript.processNode(el));
}

function agocmsViewConfigAddRel(e){
  // get template and container
  const tpl_rel = document.getElementById('agocmsFeatureLayerRelSelectField'),
        el_relContainer = e.parentNode
                            .getElementByClassname('agocms-conf-featurelayer-rels');

  // unwrap rel dom el
  const el_rel = document.importNode(tpl_rel.content, true);

  // make hyperscript el refs before appending to container
  const els_hypserscripters = el_rel.querySelectorAll('[\_]');

  // add to page
  el_relContainer.appendChild(el_rel);

  // apply hyperscript on necessary els. the fun times.
  els_hypserscripters.forEach(el => _hyperscript.processNode(el));
}

function agocmsViewConfigGroupSearch(searchText = '', usePublic = false){
  return new Promise((resolve, reject) => {
    // validate search text
    if(searchText == '') resolve([]);

    const q = new arcgisRest.SearchQueryBuilder()
                .match(searchText).in('title');

    // only search private groups
    if(!usePublic) q.and().match('private').in('access');

    // validate token and search. return array. Empty on failure
    agocms.ajx(arcgisRest.searchGroups, {q, sortField: 'title'})
      .then(response =>
          resolve(Array.isArray(response.results) ? response.results : []),
        () => resolve([]));
  });
}

function agocmsViewConfigServiceSearch(searchText = '', groupId = ''){
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

function agocmsViewConfigLayerSearch(url) {
  return new Promise((resolve, reject) => {
    // validate
    if(url == '') resolve([]);

    // get layers in feature service
    agocms.ajx(arcgisRest.getAllLayersAndTables, {url})
      .then(response => {
        // validate
        if(response.hasOwnProperty('error')){
          console.error('FAILURE: service layers.', response.error);
          resolve([]);
        } else {
          // convert array with name property to add to select label
          resolve(
            Object.entries(response).map(
              ([key, group]) => {
                // loop group items and add global ref if not set
                for(const layer of group) agocms.addDataModelRef(url, layer);

                return {name: key, layers: group};
              }));
        }
      });
  });
}

// returns dm ref
function agocmsViewConfigLayerFields(url, id){
  return agocms.getDataModelRef(url, id);
}

function agocmsViewConfigAddMapLayerRef(url, dm){
  // ref
  const capableOf = dm.capabilities,
        layerUrl = url + '/' + dm.id;

  // add or replace layer ref in map and set defaults
  agocms.viewConfig.map.layers[layerUrl]
    = { fields: {},
        create: capableOf.indexOf('Create') != -1,
        delete: capableOf.indexOf('Delete') != -1,
        attr_create: capableOf.indexOf('Update') != -1,
        geo_create: capableOf.allowGeometryUpdates === true,
        label: {
          field: dm.displayField,
          font_size: 12,
          font_color: '#000',
          bg_color: '',
          border_color: ''
        },
        relationships: [] };

  // grab ref
  const layerDef = agocms.viewConfig.map.layers[layerUrl];

  // set field config defaults
  for(const field of Object.values(dm.fields)){
    // add ref with defaults
    layerDef.fields[field.name] = {is_disabled: false, is_hidden: false};
  }
}

// takes template, loops slots and builds text to replace slots from field attributes
function agocmsPopulateFieldConfigSlots(el_field, field){
  // add ref to field
  el_field.setAttribute('d-field', field.name);

  // loop all slots in shadow dom. Slot name matches data model to rely on template
  el_field.shadowRoot.querySelectorAll('slot').forEach(el_slot => {
    // make text element and set inner to field value
    const el_text = document.createElement('text');
    el_text.innerHTML = field[el_slot.name];
    // assign text to slot
    el_text.slot = el_slot.name;

    // update field
    el_field.append(el_text);
  })

  // add field template options for specific field type
  switch(field.type){
    case 'esriFieldTypeBlob':
    case 'esriFieldTypeString':
      // add text field template for link options and clone
      const tpl_fieldConf = document.getElementById(
                              'agocmsFeatureLayerSelectFieldTextConf');
      el_fieldConf = document.importNode(tpl_fieldConf.content, true);

      // add to field shadow root
      el_field.shadowRoot.appendChild(el_fieldConf);
      break;
  }
}

// flexible functions to update layer and field configs based on input
// layer config inputs call to pass val by layer config prop ref in d-setting attr
function agocmsLayerConfigUpdate(e){
  // get field context
  const el = e.target;
  const el_layer = el.closest('li.agocms-conf-featurelayer-layer'),
        el_section = el.closest('.agocms-view-conf');

  // set field config is_hidden based on element checked
  agocms.viewConfig[el_section.getAttribute('d-type')]
    .layers[el_layer.getAttribute('d-url')]
    [el.getAttribute('d-setting')] = el.type == 'checkbox' ? el.checked : el.value;
}

// field config inputs call to pass val by field config prop ref in d-setting attr
function agocmsFieldConfigUpdate(e){
  // get field context
  const el = e.target;
  const el_field = el.getRootNode().host;
  const el_fields = el_field.closest('.agocms-conf-featurelayer-fields'),
        el_layer = el_field.closest('li.agocms-conf-featurelayer-layer'),
        el_section = el_field.closest('.agocms-view-conf');

  // set field config is_hidden based on element checked
  agocms.viewConfig[el_section.getAttribute('d-type')]
    .layers[el_layer.getAttribute('d-url')]
    .fields[el_field.getAttribute('d-field')]
    [el.getAttribute('d-setting')] = el.type == 'checkbox' ? el.checked : el.value;
}
