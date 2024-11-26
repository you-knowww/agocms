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
        el_tableLayerList = document.getElementById('agocmsConfTables'),
        el_relsAddBtn = document.getElementById('agocmsConfRelationshipsAddBtn'),
        el_relsList = document.getElementById('agocmsConfRelationshipsList');
  const mapLayers = conf.map.layers,
        tableLayers = conf.tables.layers;

  // custom event to update layer list items when reorganized
  const e_layerListReorder = new Event('layer_list_reorder');

  // add click event listeners to select access for group and service search
  for(const el_li of [...el_accessList.children]){
    el_li.addEventListener('click', e => searchLiSelect(e));
  }

  // add click event listener to new relationship button
  el_relsAddBtn.addEventListener('click', buildRelWizard);

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

  // set ui for all map layers
  for(const el of el_mapLayerList.children){
    el.dispatchEvent(e_layerListReorder);
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

        // set ui for all map layers
        for(const el of el_mapLayerList.children){
          el.dispatchEvent(e_layerListReorder);
        }
      } else {
        // add to data tables list and conf
        el_tableLayerList.appendChild(buildLayerConfLi(layerConf));
        tableLayers.push(layerConf);
      }

      updateAddRelationshipBtnAccess();
    });
  }

  // ui for layer conf list item
  function buildLayerConfLi(layerConf){
    const url = layerConf.url,
          el_layer = document.createElement('li'),
          el_settingsBtn = document.createElement('button'),
          el_fieldsBtn = document.createElement('button'),
          el_layerName = document.createElement('p'),
          el_removeBtn = document.createElement('button'),
          el_upBtn = document.createElement('button'),
          el_downBtn = document.createElement('button');

    // prevent form submit
    el_removeBtn.type = 'button';
    el_settingsBtn.type = 'button';
    el_fieldsBtn.type = 'button';
    el_upBtn.type = 'button';
    el_downBtn.type = 'button';

    // build list item before adding to list
    el_layer.setAttribute('d-url', url);

    // set content for user to recognize item
    el_layerName.innerHTML = layerConf.display_name;
    // give button cta
    el_settingsBtn.innerHTML = 'settings';
    el_removeBtn.innerHTML = 'remove';
    el_fieldsBtn.innerHTML = 'fields';
    el_upBtn.innerHTML = 'move up';
    el_downBtn.innerHTML = 'move down';

    // apply classes
    el_layer.className = 'agocms-conf-search-layer-item';
    el_settingsBtn.className = 'prod-word-break--keep prod-pointer';
    el_fieldsBtn.className = 'prod-word-break--keep prod-pointer';
    el_removeBtn.className = 'prod-word-break--keep prod-pointer';
    el_upBtn.className = 'prod-word-break--keep prod-pointer';
    el_downBtn.className = 'prod-word-break--keep prod-pointer';
    el_layerName.className = 'prod-margin-0 prod-word-break-keep';

    // disable down btn because it will be last when its new
    el_downBtn.disabled = true;

    // if first then also disable up button
    if(mapLayers.length === 0) el_upBtn.disabled = true;

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

    // click events for layer up or down
    el_upBtn.addEventListener('click', () => {
      // ref idx and all siblings
      const layerIdx = mapLayers.indexOf(layerConf),
            sibs = el_layer.parentNode.children;

      // update layer index up one
      mapLayers.splice(layerIdx, 1);
      mapLayers.splice(layerIdx - 1, 0, layerConf);

      // move up one in ui
      sibs[layerIdx - 1].before(el_layer);

      // update list UI
      for(const el of sibs){
        el.dispatchEvent(e_layerListReorder);
      }
    });
    el_downBtn.addEventListener('click', () => {
      // ref idx and all siblings
      const layerIdx = mapLayers.indexOf(layerConf),
            sibs = el_layer.parentNode.children;

      // update layer index down one
      mapLayers.splice(layerIdx, 1);
      mapLayers.splice(layerIdx + 1, 0, layerConf);

      // move up one in ui
      sibs[layerIdx + 1].after(el_layer);

      // update list UI
      for(const el of sibs){
        el.dispatchEvent(e_layerListReorder);
      }
    });

    // control up/down btn accessibility based on position
    function upDownBtnDisable(){
      // disable if only one layer
      if(mapLayers.length < 2) {
        el_upBtn.disabled = true;
        el_downBtn.disabled = true;
      } else {
        // get current layer position in list and enable up/down btns
        const layerIdx = mapLayers.indexOf(layerConf);

        // at top, no up btn
        if(layerIdx === 0) el_upBtn.disabled = true;
        else el_upBtn.disabled = false;
        // at bottom, no down btn
        if(layerIdx === mapLayers.legnth - 1) el_downBtn.disabled = true;
        else el_downBtn.disabled = false;
      }
    }

    // add event listener to layer for reorder
    el_layer.addEventListener('layer_list_reorder', upDownBtnDisable);

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

        // update relationship btn to make sure there are enough layers to make one
        updateAddRelationshipBtnAccess();

        // refresh layer select list
        listServiceLayers();

        // update UI
        for(const el of sibs){
          el.dispatchEvent(e_layerListReorder);
        }
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

        // update relationship btn to make sure there are enough layers to make one
        updateAddRelationshipBtnAccess();

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

        // update btn uis
        for(const el of sibs){
          el.dispatchEvent(e_layerListReorder);
        }
      });
    }

    // add remove, up, and down buttons
    el_layer.appendChild(el_removeBtn);
    el_layer.appendChild(el_upBtn);
    el_layer.appendChild(el_downBtn);

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

    // loop all parts except last one
    for(const part of parts.slice(0, -1)) {
      fieldRef = fieldRef[part];
    }

    // use last part to set config value. convert numbers
    fieldRef[parts.at(-1)] = el.hasAttribute('d-number') ? Number(val) : val;
  }

  // wizard for building relationships between layers
  function buildRelWizard(){
    const relConf = { parent_layer: '',
                      child_layer: '',
                      spatial_relationship: {
                        intersects: false,
                        contains: false,
                        crosses: false,
                        overlaps: false,
                        touches: false,
                        within: false },
                      related_fields: [] };
    // ref wizard
    const el_relWizard = document.createElement('agocms-config-relationship'),
          el_relWizardContainer = document.createElement('div');
    const el_relWizardShadow = el_relWizard.shadowRoot;
    // all pages
    const el_relWiz = el_relWizardShadow.getElementById('agocmsConfRelationshipWiz'),
          el_parentLayer = el_relWizardShadow.getElementById('agocmsConfRelationshipParentLayer'),
          el_childLayer = el_relWizardShadow.getElementById('agocmsConfRelationshipChildLayer'),
          el_isSpatial = el_relWizardShadow.getElementById('agocmsConfRelationshipIsSpatial'),
          el_addRelatedFieldsBtn = el_relWizardShadow.getElementById('agocmsConfRelationshipAddRelatedFeilds'),
          el_relatedFields = el_relWizardShadow.getElementById('agocmsConfRelationshipRelatedFields'),
          el_summary = el_relWizardShadow.getElementById('agocmsConfRelationshipSummary');
    const els_relWizPage = el_relWiz.getElementsByClassName('agocms-conf-rel-wiz-page');

    // ref parent and child layers for other interactions
    let parentLayer, childLayer;
    // if it can have spatial rel then show slide to define rel
    let couldHaveSpatialRel = false;

    // set first wizard page to active
    let activePageIdx = 0;

    // for avoiding dupes
    const layerList = [],
          relatedFieldConfEls = [];

    // populate layer options
    for(const {display_name, url} of mapLayers){
      // add ref to avoid dupes
      layerList.push(url);

      // make option el
      const el_option = document.createElement('option'),
            el_childOption = document.createElement('option');
      // set value and label
      el_option.innerHTML = display_name;
      el_option.value = url;
      el_childOption.innerHTML = display_name;
      el_childOption.value = url;

      // add to both parent and child for now
      el_parentLayer.appendChild(el_option);
      el_childLayer.appendChild(el_childOption);
    }
    for(const {display_name, url} of tableLayers){
      // avoid dupes for now
      if(layerList.indexOf(url) === -1){
        // make option el
        const el_option = document.createElement('option'),
              el_childOption = document.createElement('option');
        // set value and label
        el_option.innerHTML = display_name;
        el_option.value = url;
        el_childOption.innerHTML = display_name;
        el_childOption.value = url;

        // add to both parent and child for now
        el_parentLayer.appendChild(el_option);
        el_childLayer.appendChild(el_childOption);
      }
    }

    // add callback for adding new related fields
    el_addRelatedFieldsBtn.addEventListener('click', () => {
      // build related field conf. add to output and add ref for save
      const el_relatedFieldConf = buildFieldRelationshipsConf(parentLayer, childLayer);
      el_relatedFields.appendChild(el_relatedFieldConf);
      relatedFieldConfEls.push(el_relatedFieldConf);
    })

    // add wizard to container and then dialog box
    el_relWizardContainer.append(el_relWizard);

    // make dialog
    const d_dialog = Drupal.dialog(el_relWizardContainer,
                      { title: 'Configure a Layer Relationship', width: 500,
                        create: function(e, ui) {
                          // disable back and next on open
                          document.getElementById('agocmsConfRelationshipWizBackBtn').disabled = true;
                          document.getElementById('agocmsConfRelationshipWizCompleteBtn').disabled = true;
                        },
                        buttons: [
                          { text: 'Cancel', click: () => d_dialog.close() },
                          { text: 'Back', id: 'agocmsConfRelationshipWizBackBtn',
                            click: pageBack },
                          { text: 'Next', id: 'agocmsConfRelationshipWizNextBtn',
                            click: pageNext },
                          { text: 'Complete', id: 'agocmsConfRelationshipWizCompleteBtn',
                            click: () => {
                              // loop all elements with settings to update config
                              el_relWizardShadow.querySelectorAll('[d-setting]')
                                .forEach(el => setConfSettingFromEl(el, relConf));

                              // make a new conf for each related field and add ref
                              for(const el_fieldConf of relatedFieldConfEls){
                                // init conf
                                const fieldRelConf = {};

                                // set field rel values from shad root
                                el_fieldConf.shadowRoot.querySelectorAll('[d-setting]')
                                  .forEach(el => setConfSettingFromEl(el, fieldRelConf));

                                // add to rel conf
                                relConf.related_fields.push(fieldRelConf);
                              }

                              // update config
                              conf.relationships.push(relConf);

                              // update listed record and close
                              d_dialog.close(); } }
                      ]});

    d_dialog.showModal();

    // set up controls
    function pageBack(){
      const el_backBtn = document.getElementById('agocmsConfRelationshipWizBackBtn'),
            el_nextBtn = document.getElementById('agocmsConfRelationshipWizNextBtn'),
            el_completeBtn = document.getElementById('agocmsConfRelationshipWizCompleteBtn');

      // hide active page
      els_relWizPage[activePageIdx].style.display = 'none';

      // move active page back one. skip spatial
      activePageIdx --;
      if(activePageIdx === 2 && !couldHaveSpatialRel) activePageIdx --;

      // show previous page
      els_relWizPage[activePageIdx].style.display = '';

      // if first idx hide button. make sure next button is displayed
      if(activePageIdx === 0) el_backBtn.disabled = false;
      el_nextBtn.disabled = false;
      // always disable complete btn
      el_completeBtn.disabled = true;
    }
    function pageNext(){
      const el_backBtn = document.getElementById('agocmsConfRelationshipWizBackBtn'),
            el_nextBtn = document.getElementById('agocmsConfRelationshipWizNextBtn'),
            el_completeBtn = document.getElementById('agocmsConfRelationshipWizCompleteBtn');

      // if paging next on the child layer select page, check if both have spatial
      if(activePageIdx === 1){
        // get parent and child layer
        parentLayer = mapLayers.find(l => l.url == el_parentLayer.value),
        childLayer = mapLayers.find(l => l.url == el_childLayer.value);

        // if either is undefined, try again with tables
        if(typeof parentLayer == 'undefined')
          parentLayer = tableLayers.find(l => l.url == el_parentLayer.value);
        if(typeof childLayer == 'undefined')
          childLayer = tableLayers.find(l => l.url == el_childLayer.value);

        // update possibility of spatial rel
        couldHaveSpatialRel = parentLayer.has_geometry === true
                                && childLayer.has_geometry === true;

        // empty related fields
        el_relatedFields.innherHTML = '';
      }

      // hide active page
      els_relWizPage[activePageIdx].style.display = 'none';

      // move active page forward one. skip spatial
      activePageIdx ++;
      if(activePageIdx === 2 && !couldHaveSpatialRel) activePageIdx ++;

      // show next page
      els_relWizPage[activePageIdx].style.display = '';

      // if last idx hide and show complete. make sure back btn is displayed
      if(activePageIdx === 4) {
        el_nextBtn.disabled = true;
        // enable complete btn
        el_completeBtn.disabled = false;
      }
      el_backBtn.disabled = false;
    }
  }

  // update new relationship based on available relationships
  function updateAddRelationshipBtnAccess(){
    // enable relationships button if 2 or more layers. otherwise disable
    if(mapLayers.length + tableLayers.length > 1) el_relsAddBtn.removeAttribute('disabled');
    else el_relsAddBtn.setAttribute('disabled', 'disabled');
  }

  // build parent/child field relationship config form from layers
  function buildFieldRelationshipsConf(parentLayer, childLayer) {
    // get template and shadowroot
    const el_relFieldsConf = document.createElement('agocms-config-relationship-fields');
    const el_relFieldsConfShadow = el_relFieldsConf.shadowRoot;
    // get parent and child selects to populate
    const el_parentFieldSel = el_relFieldsConfShadow.getElementById('agocmsConfRelationshipParentField'),
          el_childFieldSel = el_relFieldsConfShadow.getElementById('agocmsConfRelationshipChildField'),
          el_parentLayerName = el_relFieldsConfShadow.getElementById('agocmsConfRelationshipParentFieldLayerName'),
          el_childLayerName = el_relFieldsConfShadow.getElementById('agocmsConfRelationshipChildFieldLayerName');

    // set namnes
    el_parentLayerName.innerHTML = parentLayer.display_name;
    el_childLayerName.innerHTML = childLayer.display_name;

    // add options to parent and child field selects
    for(const field of parentLayer.fields){
      // make option
      const el_fieldOpt = document.createElement('option');

      // set value and text
      el_fieldOpt.value = field.name;
      el_fieldOpt.innerHTML = field.label;

      // add to select
      el_parentFieldSel.append(el_fieldOpt);
    }
    for(const field of childLayer.fields){
      // make option
      const el_fieldOpt = document.createElement('option');

      // set value and text
      el_fieldOpt.value = field.name;
      el_fieldOpt.innerHTML = field.label;

      // add to select
      el_childFieldSel.append(el_fieldOpt);
    }

    // return new el
    return el_relFieldsConf;
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
