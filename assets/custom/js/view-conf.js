// define web component for fields
const customEls = [{handle: 'agocms-config-layer', id: 'agocmsConfFeatureLayer'},
                    { handle: 'agocms-config-fields', id: 'agocmsConfFields'},
                    { handle: 'agocms-config-field', id: 'agocmsConfField'},
                    { handle: 'agocms-config-field-text-settings',
                      id: 'agocmsConfFieldTextSettings'},
                    { handle: 'agocms-config-field-decimal-settings',
                      id: 'agocmsConfFieldDecimalSettings'},
                    { handle: 'agocms-config-field-number-settings',
                      id: 'agocmsConfFieldNumberSettings'},
                    { handle: 'agocms-config-field-date-settings',
                      id: 'agocmsConfFieldDateSettings'},
                    { handle: 'agocms-config-field-coded-vals-list',
                      id: 'agocmsConfFieldCodedValsList'},
                    { handle: 'agocms-config-field-coded-val-item',
                      id: 'agocmsConfFieldCodedValItem'},
                    { handle: 'agocms-config-relationship',
                      id: 'agocmsConfRelationship'},
                    { handle: 'agocms-config-relationship-fields',
                      id: 'agocmsConfRelationshipsRelatedFields'}];

// define all custom elements
for(const customEl of customEls){
  customElements.define(customEl.handle,
    class extends HTMLElement {
      constructor() {
        super();
        const tpl = document.getElementById(customEl.id);
        const shadowRoot = this.attachShadow({mode: 'open'});
        shadowRoot.appendChild(tpl.content.cloneNode(true));
      } });
}

// map esri field type to custom field element
const esriFieldTypeToFieldEl = {
  esriFieldTypeBlob: 'agocms-config-field-text-settings',
  esriFieldTypeString: 'agocms-config-field-text-settings',
  esriFieldTypeSmallInteger: 'agocms-config-field-decimal-settings',
  esriFieldTypeDouble: 'agocms-config-field-decimal-settings',
  esriFieldTypeSingle: 'agocms-config-field-decimal-settings',
  esriFieldTypeInteger: 'agocms-config-field-number-settings',
  esriFieldTypeDate: 'agocms-config-field-date-settings' };

// contain in iif
((drupalSettings) => {
  // refs
  const conf = drupalSettings.hasOwnProperty('agocms')
                  && drupalSettings.agocms.hasOwnProperty('conf')
                  && drupalSettings.agocms.conf.hasOwnProperty('map')
                ? drupalSettings.agocms.conf
                : {map: {layers: []}, tables: {layers: []}, relationships: []},
        el_addForm = document.getElementById('node-ago-view-form'),
        el_editForm = document.getElementById('node-ago-view-edit-form'),
        el_confField = document.getElementById('agocms-view-conf'),
        el_accessList = document.getElementById('agocmsConfSearchAccessList'),
        el_groupSearch = document.getElementById('agocmsConfSearchGroups'),
        el_groupList = document.getElementById('agocmsConfSearchGroupsList'),
        el_serviceSearch = document.getElementById('agocmsConfSearchServices'),
        el_serviceList = document.getElementById('agocmsConfSearchServicesList'),
        el_layerList = document.getElementById('agocmsConfSearchLayersList'),
        el_mapLayerList = document.getElementById('agocmsConfMapLayers'),
        el_tableLayerList = document.getElementById('agocmsConfTables');
  const mapLayers = conf.map.layers,
        tableLayers = conf.tables.layers;

  // add click event listeners to select access for group and service search
  for(const el_li of [...el_accessList.children]){
    el_li.addEventListener('click', e => searchLiSelect(e));
  }

  // get private groups and list on initial load
  agocmsViewConfigGroupSearch().then(groups =>
    searchListBuilder(el_groupList, groups, 'id', 'title', listGroupServices));

  // add search event listeners to group and service searches
  el_groupSearch.addEventListener('keyup', debounce(e =>
      agocmsViewConfigGroupSearch(e.target.value, getListVal(el_accessList) == 'public')
        .then(groups => {
          // clear service list and group list
          clearSearchList(el_serviceList);
          clearSearchList(el_groupList);
          searchListBuilder(el_groupList, groups, 'id', 'title', listGroupServices);
        }) ));
  el_serviceSearch.addEventListener('keyup', debounce(listGroupServices));

  // event listener for add/edit form submit
  if(el_addForm){
    el_addForm.addEventListener('submit', () => el_confField.value = JSON.stringify(conf));
  } else if(el_editForm){
    el_editForm.addEventListener('submit', () => el_confField.value = JSON.stringify(conf));
  }

  // load existing map layers to ui then same with table layers
  for(const layer of mapLayers){
    // add layer ref to agocms and build config ui
    agocms.getDm(layer.url).then(dm => el_mapLayerList.appendChild(buildLayerConfLi(layer)));
  }
  for(const layer of tableLayers){
    // add layer ref to agocms and build config ui
    agocms.getDm(layer.url).then(dm => el_tableLayerList.appendChild(buildLayerConfLi(layer)));
  }

  // take list element and return value from selected option
  function getListVal(el_list){
    // get selected access level element
    const el_li = el_list.querySelector('.agocms-conf-search-list-item--selected');

    // get value from li. fallback on empty string
    return el_li ? el_li.getAttribute('d-val') : '';
  }

  // give search result to error
  function addErrorToList(el_ul){
    // no results make error li to prompt user
    const el_errorLi = document.createElement('li');
    // error message
    el_errorLi.innerHTML = 'No results. Try different search or access to get results.';
    // add to result list
    el_ul.appendChild(el_errorLi);
  }

  // deselect siblings, select option, and fire callback with selection
  function searchLiSelect(e, callback = false){
    // ref
    const el = e.target;
    const classes = el.classList,
          selectedClass = 'agocms-conf-search-list-item--selected';

    // only proceed if not selected as determined by set classes
    if(!classes.contains(selectedClass)){
      // get all siblings and loop
      for(el_sib of [...el.parentNode.children].filter(n => n != el)){
        // remove selected class from all siblings
        el_sib.classList.remove(selectedClass);
      }

      // add selected class to this element
      classes.add(selectedClass);

      // validate callback then get value from data and send to callback
      if(callback !== false) callback();
    }
  }

  // callback to write search results to list
  function searchListBuilder(el_ul, items, valProp, lblProp, callback = false){
    // validate results
    if(items.length == 0){
      addErrorToList(el_ul);
    } else {
      // add all options to group list
      for(const item of items){
        // make li element
        const el_li = document.createElement('li');
        // add ref to unique identifier value
        el_li.setAttribute('d-val', item[valProp]);
        // set content for user to recognize item
        el_li.innerHTML = item[lblProp];
        // apply class
        el_li.className = 'agocms-conf-search-list-item';
        // set up click events. add callback if included
        el_li.addEventListener('click', e => searchLiSelect(e, callback));
        // add to result list
        el_ul.appendChild(el_li);
      }
    }
  }

  // empty list
  function clearSearchList(el_ul){ el_ul.innerHTML = ''; }

  // callback for service keyup and group search click
  function listGroupServices(){
    // call service search. if selected group el, get val. otherwise empty string
    agocmsViewConfigServiceSearch(el_serviceSearch.value, getListVal(el_groupList))
      .then(services => {
        clearSearchList(el_serviceList);
        searchListBuilder(el_serviceList, services, 'url', 'title', listServiceLayers);
      });
  }

  // callback for service click
  function listServiceLayers(){
    // get selected group el and other refs
    const val = getListVal(el_serviceList);

    // validate
    if(val !== ''){
      // get layers for service url
      agocmsViewConfigLayersForService(val)
        .then(layerGroups => {
          clearSearchList(el_layerList);
          // validate
          if(layerGroups.length == 0){
            // show error
            addErrorToList(el_ul);
          } else {
            // loop results
            for(const layerGroup of layerGroups){
              // make li element for group label
              const el_labelLi = document.createElement('li');
              // set content for user to recognize group label
              el_labelLi.innerHTML = layerGroup.name + ':';
              // add label to list
              el_layerList.appendChild(el_labelLi);

              // loop all layers and add list items
              for(const layer of layerGroup.layers){
                // make li element
                const el_li = document.createElement('li'),
                      el_layerName = document.createElement('p'),
                      el_addBtn = document.createElement('button'),
                      url = val + '/' + layer.id;

                // also have to set type to 'button' to prevent form submit
                el_addBtn.type = 'button';

                // set content for user to recognize item
                el_layerName.innerHTML = '&nbsp;' + layer.name;
                // give button cta
                el_addBtn.innerHTML = 'add';

                // apply classes
                el_li.className = 'agocms-conf-search-layer-item';
                el_addBtn.className = 'prod-word-break--keep prod-pointer';
                el_layerName.className = 'prod-margin-0 prod-word-break-keep';

                // set up click event to disable button and add to conf
                el_addBtn.addEventListener('click', () => {
                  // disable button, add ref to api and add layer to conf
                  el_addBtn.setAttribute('disabled', 'disabled');
                  agocms.addDataModelRef(val, layer);
                  addLayerToConf(url);
                });

                // if already added then disable
                if(mapLayers.findIndex(l => l.url === url) !== -1
                    || tableLayers.findIndex(l => l.url === url) !== -1){
                  el_addBtn.setAttribute('disabled', 'disabled');
                }

                // add button to layer list item
                el_li.appendChild(el_addBtn);
                // add layer name ref to list item
                el_li.appendChild(el_layerName);
                // add to result list
                el_layerList.appendChild(el_li);
              }
            }
          }
        });
    }
  }

  // called by layer add button
  function addLayerToConf(url, toTable = false){
    // get dm from reference
    agocms.getDm(url).then(layer => {
      // refs
      const capableOf = layer.capabilities,
            layerConf = { url,
                          display_name: layer.name,
                          // simplifies config
                          has_geometry: layer.hasOwnProperty('geometryType'),
                          fields: layer.fields.map(f => {
                            return {name: f.name, label: f.alias,
                                    is_disabled: false, is_hidden: false}; }) };

      // validate crud and default each conf to false
      if(capableOf.indexOf('Create') != -1) layerConf.can_create = false;
      if(capableOf.indexOf('Delete') != -1) layerConf.can_delete = false;
      if(capableOf.indexOf('Update') != -1) layerConf.can_update_attr = false;

      // does layer have geometry? if so default add to map
      if(layerConf.has_geometry && toTable === false){
        // give layer config map settings if available
        if(layer.allowGeometryUpdates === true) layerConf.can_update_geo = false;
        layerConf.label = { field: layer.displayField, font_size: 12,
                            font_color: '#000', bg_color: '', border_color: '' };

        // add ref and add li to map list
        mapLayers.push(layerConf);
        el_mapLayerList.appendChild(buildLayerConfLi(layerConf));
      } else {
        // add to data tables list and conf
        el_tableLayerList.appendChild(buildLayerConfLi(layerConf));
        tableLayers.push(layerConf);
      }
    });
  }

  // ui for layer conf list item
  function buildLayerConfLi(layerConf){
    const url = layerConf.url,
          el_layer = document.createElement('li'),
          el_settingsBtn = document.createElement('button'),
          el_fieldsBtn = document.createElement('button'),
          el_layerName = document.createElement('p'),
          el_removeBtn = document.createElement('button');

    // prevent form submit
    el_removeBtn.type = 'button';
    el_settingsBtn.type = 'button';
    el_fieldsBtn.type = 'button';

    // build list item before adding to list
    el_layer.setAttribute('d-url', url);

    // set content for user to recognize item
    el_layerName.innerHTML = layerConf.display_name;
    // give button cta
    el_settingsBtn.innerHTML = 'settings';
    el_removeBtn.innerHTML = 'remove';
    el_fieldsBtn.innerHTML = 'fields';

    // apply classes
    el_layer.className = 'agocms-conf-search-layer-item';
    el_settingsBtn.className = 'prod-word-break--keep prod-pointer';
    el_fieldsBtn.className = 'prod-word-break--keep prod-pointer';
    el_removeBtn.className = 'prod-word-break--keep prod-pointer';
    el_layerName.className = 'prod-margin-0 prod-word-break-keep';

    // add click event for layer settings
    el_settingsBtn.addEventListener('click', () => {
      // build form and close dialog on save and update layer name on save
      buildLayerConfForm(layerConf).then(el_layerForm => {
        // add form to container and then dialog box
        const el_layerFormContainer = document.createElement('div');
        // add form to container and open dialog box
        el_layerFormContainer.appendChild(el_layerForm);

        const d_dialog = Drupal.dialog(el_layerFormContainer,
                          { title: 'Feature Layer Settings', width: 500,
                            buttons: [
                              { text: "Cancel", click: () => d_dialog.close() },
                              { text: "Save", click: () => {
                                // loop all elements with settings to update config
                                el_layerForm.shadowRoot.querySelectorAll('[d-setting]')
                                  .forEach(el => setConfSettingFromEl(el, layerConf));

                                // update listed record and close
                                el_layerName.innerHTML = '&nbsp;' + layerConf.display_name;
                                d_dialog.close(); } }
                          ]});

        d_dialog.showModal();
      });
    });

    el_fieldsBtn.addEventListener('click', () => {
      // build form and close dialog box on callback
      buildLayerFieldsForm(layerConf).then(el_fieldsForm => {
        // build layer form container and add to dialog box
        const el_fieldsFormContainer = document.createElement('div');
        // add form to container and open dialog box
        el_fieldsFormContainer.appendChild(el_fieldsForm);

        const d_dialog = Drupal.dialog(el_fieldsFormContainer,
                          { title: 'Feature Layer Fields', width: 600,
                            buttons: [
                              { text: "Cancel", click: () => d_dialog.close() },
                              { text: "Save", click: () => {
                                // ref layer fields
                                const fieldsConf = layerConf.fields;

                                // loop fields
                                el_fieldsForm.shadowRoot.querySelectorAll('agocms-config-field')
                                  .forEach(el => {
                                    // only get fieldname once to find layer field conf
                                    const fieldName = el.getAttribute('d-field')

                                    // get field config and validate
                                    const fieldConf = layerConf.fields.find(f => f.name == fieldName);

                                    // validate and set field config
                                    if(typeof fieldConf != 'undefined') setFieldSettingFromEl(el, fieldConf);

                                    // loop possible specific config settings and update config from that
                                    for(const [esriFieldType, customElTag] of Object.entries(esriFieldTypeToFieldEl)){
                                      // find custom config element for field
                                      el.shadowRoot.querySelectorAll(customElTag).forEach(el_cust => {
                                        // set field config
                                        setFieldSettingFromEl(el_cust, fieldConf);
                                      });
                                    }
                                  });

                                // update listed record and close
                                d_dialog.close(); } }
                            ]});
        d_dialog.showModal();
      });
    });

    // add settings button, remove button, and layer name
    el_layer.appendChild(el_layerName);
    el_layer.appendChild(el_settingsBtn);
    el_layer.appendChild(el_fieldsBtn);

    // only maps have label config. placed here so its 3rd button
    if(layerConf.hasOwnProperty('label')){
      // make button to add to data tables
      const el_tablesBtn = document.createElement('button');

      // prevent form submit
      el_tablesBtn.type = 'button';

      // fill out text and classes
      el_tablesBtn.innerHTML = 'add to tables';
      el_tablesBtn.className = 'prod-word-break--keep prod-pointer agocms-conf-map-layer-add-tables';

      // add event listener to add reference to tables and disable button
      el_tablesBtn.addEventListener('click', () => {
        el_tablesBtn.setAttribute('disabled', 'disabled');
        addLayerToConf(url, true);
      });

      // remove button removes from map ref
      el_removeBtn.addEventListener('click', () => {
        // get layer conf ref index and remove it
        mapLayers.splice(mapLayers.findIndex(l => l.url === url), 1);

        // delete el
        el_layer.remove();

        // refresh layer select list
        listServiceLayers();
      });

      // disable if already in tables
      if(tableLayers.findIndex(l => l.url === url) !== -1) el_tablesBtn.disabled = true;

      // add button to layer output
      el_layer.appendChild(el_tablesBtn);
    } else {
      // remove button removes from map ref
      el_removeBtn.addEventListener('click', () => {
        // get layer conf ref index and remove it
        tableLayers.splice(tableLayers.findIndex(l => l.url === url), 1);

        // delete el
        el_layer.remove();

        // refresh layer select list
        listServiceLayers();

        // if layer has geometry look for a map counterpart
        if(layerConf.has_geometry){
          // look for selected counterpart
          const el_mapLayerAddTblBtn = el_mapLayerList.querySelector(
                                          '[d-url="'+url+'"] .agocms-conf-map-layer-add-tables');

          // validate and reenable add to tables btn
          if(el_mapLayerAddTblBtn !== null) el_mapLayerAddTblBtn.removeAttribute('disabled');
        }
      });
    }

    // finally add remove button
    el_layer.appendChild(el_removeBtn);

    // return list item
    return el_layer;
  }

  // build layer conf form
  function buildLayerConfForm(layerConf){
    return new Promise((resolve, reject) => {
      agocms.getDm(layerConf.url).then(layer => {
        // refs
        const el_layerForm = document.createElement('agocms-config-layer');
        const el_shadow = el_layerForm.shadowRoot;
        const el_name = el_shadow.getElementById('agocmsConfLayerFormLayerName'),
              el_url = el_shadow.getElementById('agocmsConfLayerFormLayerUrl'),
              el_nameField = el_shadow.getElementById('agocmsConfLayerFormDisplayName'),
              els_crudConfigs = el_shadow.querySelectorAll('#agocmsConfLayerFormCrud input'),
              el_lblDiv = el_shadow.getElementById('agocmsConfLayerFormLbl');

        // layer defining attributes
        el_name.innerHTML = layer.name;
        el_url.innerHTML = layerConf.url;

        // set layer name input val
        el_nameField.value = layerConf.display_name;

        // loop all possible crud fields and show applicable fields
        els_crudConfigs.forEach(el_input => {
          // get relevant setting
          const setting = el_input.getAttribute('d-setting');
          console.log(setting, layerConf, layerConf[setting])
          if(layerConf.hasOwnProperty(setting)){
            // set configured value
            if(layerConf[setting] === true) el_input.checked = true;
            // reveal parent
            el_input.parentNode.style = "";
          } else {
            // remove parent elment
            el_input.parentNode.remove();
          }
        })

        if(layerConf.hasOwnProperty('label')){
          const el_lblField = el_shadow.getElementById('agocmsConfLayerFormLblField'),
                // get all input fields and set label setting name prefix
                els_lblSettings = el_lblDiv.querySelectorAll('input, select');

          // show label config container
          el_lblDiv.style = "";

          // add all fields as options
          for(const field of layer.fields){
            // make new options
            const el_fieldOpt = document.createElement('option');
            el_fieldOpt.value = field.name
            el_fieldOpt.innerHTML = field.alias

            // default option to current config value
            if(layerConf.label.field === field.name){
              el_fieldOpt.setAttribute('selected', 'selected');
            }

            // add to select
            el_lblField.appendChild(el_fieldOpt);
          }

          // fill in current settings
          els_lblSettings.forEach(el_input => {
            // parse setting conf field from string with dot reference
            const settingVal = getConfSettingFromEl(el_input, layerConf);
            // set value to element
            el_input.value = settingVal;
          })
        } else {
          // remove layer label configs
          el_shadow.getElementById('agocmsConfLayerFormLbl').remove();
        }

        // send element back and let caller manage
        resolve(el_layerForm);
      });
    });
  }

  // build layer fields form
  function buildLayerFieldsForm(layerConf) {
    return new Promise((resolve, reject) => {
      agocms.getDm(layerConf.url).then(layer => {
        // get form element
        const el_layerForm = document.createElement('agocms-config-fields');
        const el_shadow = el_layerForm.shadowRoot;
        const el_fieldsContainer = el_shadow.getElementById('agocmsConfFieldsFormFieldList');

        el_shadow.getElementById('agocmsConfFieldsFormLayerName').innerHTML = layer.name;
        el_shadow.getElementById('agocmsConfFieldsFormLayerUrl').innerHTML = layerConf.url;
        el_shadow.getElementById('agocmsConfFieldsFormLayerDisplayName').innerHTML = layerConf.display_name;

        // validate layer has fields
        if(layer.fields.length > 0){
          // build all field configs
          for(const dmField of layer.fields){
            // get configured counterparts
            let fieldConf = layerConf.fields.find(f => f.name == dmField.name);

            // validate dm hasnt introduced a new field to configure
            if(typeof fieldConf == 'undefined'){
              // add default field config add to config
              fieldConf = { name: dmField.name, label: dmField.alias,
                            is_disabled: false, is_hidden: false };
              layerConf.fields.push(fieldConf);
            }

            // get field settings element
            const el_field = buildFieldConfEl(document.createElement('agocms-config-field'),
                                fieldConf, dmField);

            // force any classnames to style
            el_field.className = 'prod-block prod-margin-10 prod-pad-10 prod-border';

            // add to fields container
            el_fieldsContainer.appendChild(el_field);
          }
        } else {
          // warn user
          el_fieldsContainer.innerHMTL = '<b>Could not get fields from service</b>';
        }

        resolve(el_layerForm);
      }, e => reject(e));
    });
  }

  // takes template, loops slots and builds text to replace slots from field attributes
  function buildFieldConfEl(el_field, conf, dm){
    // add ref to field
    el_field.setAttribute('d-field', dm.name);
    // merge dm and configs
    const el_shadow = el_field.shadowRoot,
          dmConf = Object.assign({}, conf, dm);

    // loop all slots in shadow dom. Slot name matches data model to rely on template
    el_shadow.querySelectorAll('slot').forEach(el_slot => {
      // make text element and set inner to field value
      const el_text = document.createElement('text');
      el_text.innerHTML = dmConf[el_slot.name];
      // assign text to slot
      el_text.slot = el_slot.name;

      // update field
      el_field.append(el_text);
    });

    // set fundamental field values from config
    setFieldElFromSettings(el_field, conf)

    // validate coded value domains and handle specifically
    if(dm.hasOwnProperty('domain') && dm.domain != null
        && dm.domain.hasOwnProperty('codedValues')
        && Array.isArray(dm.domain.codedValues)){
      // build container and coded value domain label
      const el_codedVals = document.createElement('agocms-config-field-coded-vals-list');
      const el_codedValsShadow = el_codedVals.shadowRoot;
      const el_codedValsList = el_codedValsShadow.querySelector('.agocms-conf-field-codes');

      // loop coded value domains and display all options
      for(const {code, name} of dm.domain.codedValues){
        // add coded value
        const el_codedValItem = document.createElement('agocms-config-field-coded-val-item');
        const el_codedValItemShadow = el_codedValItem.shadowRoot;
        el_codedValItemShadow.querySelector('.agocms-conf-field-codes-code').innerHTML = code;
        el_codedValItemShadow.querySelector('.agocms-conf-field-codes-name').innerHTML = name;

        // add to container
        el_codedValsList.appendChild(el_codedValItem);
      }

      // add container to field
      el_shadow.appendChild(el_codedVals);
    } else {
      // validate there is a special element for field type
      if(esriFieldTypeToFieldEl.hasOwnProperty(dmConf.type)){
        // add field template options for specific field type
        const el_typeSettings = document.createElement(esriFieldTypeToFieldEl[dmConf.type]);
        // set value
        setFieldElFromSettings(el_typeSettings, conf);
        // add to shadow root
        el_shadow.appendChild(el_typeSettings);
      }
    }

    return el_field;
  }

  // parse field form field elements and output setting json
  function setFieldSettingFromEl(el, fieldConf){
    // loop all setting els in field update config
    el.shadowRoot.querySelectorAll('[d-setting]')
      .forEach(el => setConfSettingFromEl(el, fieldConf));
  }

  // parse field settings and output to field conf ui
  function setFieldElFromSettings(el, conf){
    // loop all setting els in field update config
    el.shadowRoot.querySelectorAll('[d-setting]')
      .forEach(el => {
        // get config setting for el
        const val = conf[el.getAttribute('d-setting')];

        // validate
        if(typeof val != 'undefined'){
          // different output based on input type
          switch(el.type){
            case 'checkbox':
              if(val === true) el.checked = 'checked';
              break;
            default:
              el.value = val;
          }
        }
      });
  }

  function getConfSettingFromEl(el, layerConf) {
    // parse settings el by period and set starting point
    const settingParts = el.getAttribute('d-setting').split('.');
    let out = layerConf;

    // loop parts to get to end config value
    for(const part of settingParts) {
      out = out[part];
    }

    // done return output
    return out;
  }

  function setConfSettingFromEl(el, layerConf) {
    // parse settings el by period and set starting point
    const parts = el.getAttribute('d-setting').split('.');
    // convert checkbox to bool
    let val = el.type == 'checkbox' ? el.checked : el.value,
        fieldRef = layerConf;

    // loop all parts except lat one
    for(const part of parts.slice(0, -1)) {
      fieldRef = fieldRef[part];
    }

    // use last part to set config value. convert numbers
    fieldRef[parts.at(-1)] = el.hasAttribute('d-number') ? Number(val) : val;
  }
})(drupalSettings);

// search for groups in private or public and private
function agocmsViewConfigGroupSearch(searchText = '', usePublic = false){
  return new Promise((resolve, reject) => {
    // if blank and public then respond with empty results
    if(searchText == '' && usePublic === true) resolve([]);

    // build query
    const q = new arcgisRest.SearchQueryBuilder()

    // if blank and private, send back all private possible. else search
    if(searchText !== ''){
      q.match(searchText).in('title');
      // only search private groups
      if(!usePublic) q.and().match('private').in('access');
    } else {
      // search text is blank and would not arrive here with public
      q.match('private').in('access');
    }


    // validate token and search. return array. Empty on failure
    agocms.ajx(arcgisRest.searchGroups, {q, sortField: 'title'})
      .then(response =>
          resolve(Array.isArray(response.results) ? response.results : []),
        () => resolve([]));
  });
}

// search for services available to a group
function agocmsViewConfigServiceSearch(searchText = '', groupId = ''){
  return new Promise((resolve, reject) => {
    // validate search text
    if(searchText == '' && groupId == '') resolve([]);

    // keyword search on all items filtered to Feature Services
    const q = new arcgisRest.SearchQueryBuilder().match('Feature Service').in('type');

    // skip if search is empty
    if(searchText !== '') q.and().match(searchText).in('title');

    // run group search if groupId is set. If not, groupId ignored by api
    agocms.ajx(groupId == '' ? arcgisRest.searchItems : arcgisRest.searchGroupContent,
        {q, groupId, sortField: 'title'})
      .then(r => resolve(Array.isArray(r.results) ? r.results : []), () => resolve([]));
  })
}

// get all layers for service
function agocmsViewConfigLayersForService(url) {
  return new Promise((resolve, reject) => {
    // validate
    if(url == '') resolve([]);

    // get layers in feature service
    agocms.ajx(arcgisRest.getAllLayersAndTables, {url}).then(response => {
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

// debounce very simple now. David Walsch example
function debounce(f, wait = 700) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => f.apply(this, args), wait);
  };
};
