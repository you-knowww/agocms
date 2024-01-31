class Agocms {
  // invalidate if there is no ago access token from login
  #valid = true;
  // default locked to false but check lock on init
  #locked = false;
  // instance of ArcGISIdentityManager to rely on ESRI's standard
  #agoIdMgr
  // manage events across context in origin. const
  #ch = new BroadcastChannel('agocms');
  // local event listener to dispatch after updating local creds. const
  #ev_updatedToken = new Event('local_token_updated');

  // provide public references. Good for quick access to data model info
  refs = { data_models: {} };

  // views have configs with maps, tables, and relationships. public
  viewConfig = { map: {layers: []}, tables: {layers: []}, relationships: [] };

  // requires build. if build doesnt provide agoIdMgr then set invalid
  constructor(){
    // context
    const agocms = this;

    // validate access token from AGO Social Auth
    if(drupalSettings.hasOwnProperty('agocms_token')
        && drupalSettings.agocms_token != null
        && drupalSettings.agocms_token.hasOwnProperty('token')){
      // ref
      const tokenData = drupalSettings.agocms_token;

      // build manager object for ago rest api
      this.#agoIdMgr = new arcgisRest.ArcGISIdentityManager(
                              { clientId: tokenData.client_id,
                                portal: tokenData.url + '/sharing/rest',
                                token: tokenData.token,
                                tokenExpires: new Date(tokenData.expires),
                                refreshToken: tokenData.refresh_token,
                                refreshTokenExpires: new Date(tokenData.refresh_expires),
                                username: tokenData.username,
                                redirectUri: window.location.hostname });

      // set event listener for lock and unlock
      this.#ch.onmessage = message => {
            // ref
            const data = message.data;

            switch(data.event){
              case 'lock':
                // lock down requests
                agocms.#locked = true;
                break;
              case 'unlock':
                // begin unlocking. first need to update refs
                agocms.#updateTokenRefs(data.idMgr);
                break;
              default:
                // basic log
                console.error('Invalid agocms broadcast channel event: ' + data.event);
            } };
    } else {
      // invalidate the entire thing and throw error
      this.#valid = false;
      console.error('AGO token is nonexistent or entirely invalid and unrenewable.');
    }
  }

  // async return access token as string
  reconcileToken(){
    // set context
    const agocms = this;

    // async
    return new Promise((resolve, reject) => {
      // reject completely if invalid to begin with
      if(!agocms.#valid) reject(false);

      // check lock
      if(agocms.#locked === true){
        // set onetime event listener on unlock
        window.addEventListener('local_token_updated',
            () => resolve(agocms.#agoIdMgr), {once: true});
      } else {
        // check token expiration
        if(agocms.#isAccessTokenExpired()){
          // get new token
          agocms.#refreshToken().then(idMgr => resolve(idMgr));
        } else {
          // get the token we have
          resolve(agocms.#agoIdMgr);
        }
      }
    });
  }

  // run any function and attaches token to request. expects arcgisrest fn
  ajx(agoApiFn, conf){
    // context
    const agocms = this;

    // async
    return new Promise((resolve, reject) => {
      // get token and perform api call with token, or reject
      agocms.reconcileToken().then(() => {
        // set auth, hide token in get, and limit url length of get to 2k
        conf.authentication = agocms.#agoIdMgr;
        conf.hideToken = true;
        conf.maxUrlLength = 2000;

        // run fn with token and resolve/reject
        agoApiFn(conf).then(d => resolve(d), d => reject(d));
      }, d => reject(d))
    })
  }

  // validate against existing data model refs and add new given service and layer def
  addDataModelRef(url, layer){
    // ref
    const dms = this.refs.data_models;

    // build with service url and layer id. check service url for trailing /
    url += url.substr(-1) == '/' ? layer.id : '/' + layer.id;

    // validate not already referenced and add ref
    if(!dms.hasOwnProperty(url)) dms[url] = layer;
  }

  // if layer id included expects url to be service url.
  // if no layer id expects url to be full layer url.
  getDataModelRef(url, id = null){
    // if layer id included expects url to be service url.
    if(id !== null){
      // build with service url and layer id. check service url for trailing /
      url += url.substr(-1) == '/' ? id : '/' + id;
    }

    return this.refs.data_models[url];
  }

  // return bool
  #isAccessTokenExpired(){
    // compare expiration against 20 seconds before now
    const now = new Date(Date.now() - 20000);
    return now >= this.#agoIdMgr.tokenExpires;
  }

  #refreshToken() {
    // context
    const agocms = this,
          idMgr = this.#agoIdMgr;

    // lock and broadcast lock to any other open tabs
    this.#locked = true;
    this.#ch.postMessage({event: 'lock'});

    // async
    return new Promise((resolve, reject) => {
      // use ago id manager api to refresh creds
      idMgr.refreshCredentials().then(newIdMgr => {
          // update session token
          jQuery.post('/agocms/token/update',
              { token: newIdMgr.token,
                expires: newIdMgr.tokenExpires.getTime(),
                refresh_token: newIdMgr.refreshToken,
                refresh_expires: newIdMgr.refreshTokenExpires.getTime() })
            .then(() => {
              // update local ref
              agocms.#updateTokenRefs(newIdMgr);

              // notify all other windows to unlock
              agocms.#ch.postMessage({event: 'unlock', idMgr});

              // return new token from settings
              resolve(idMgr);
            }, err => console.error(err));
        },
        // warn user
        () => console.error('Creds refresh failed.', idMgr.portal));
    });
  }

  #updateTokenRefs(idMgr) {
    // update ago id manager ref
    this.#agoIdMgr = idMgr;

    // unlock
    this.#locked = false;

    // dispatch window event
    window.dispatchEvent(this.#ev_updatedToken);
  }
}

(function (Drupal, drupalSettings){
  // init global agocms
  agocms = new Agocms();
})(Drupal, drupalSettings);
