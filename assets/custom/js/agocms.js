class Agocms {
  // invalidate if there is no ago access token from login
  #valid = true;
  // default locked to false but check lock on init
  #locked = false;
  // instance of ArcGISIdentityManager to rely on ESRI's standard
  #agoIdMgr
  // objects
  #access;
  #refresh;
  // ago username
  #username;
  // base url and client id for token refresh
  #url;
  #clientId;
  // manage events across context in origin. const
  #ch = new BroadcastChannel('agocms');
  // local event listener to dispatch after updating local creds. const
  #ev_updatedToken = new Event('local_token_updated');

  // provide public references. Good for quick access to data model info
  refs = { data_models: {} };

  // requires build. if build doesnt provide agoIdMgr then set invalid
  constructor(agoIdMgr = false){
    // context
    const agocms = this;

    // validate access token from AGO Social Auth
    if(agoIdMgr === false){
      // invalidate the entire thing and throw error
      this.#valid = false;
      console.error('AGO token is nonexistent or entirely invalid and unrenewable.');
    } else {
      // ref
      const tokenSettings = drupalSettings.ago_access_token;
      const token = tokenSettings.token;

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
                agocms.#updateTokenRefs(data.token_data);
                break;
              default:
                // basic log
                console.error('Invalid agocms broadcast channel event: ' + data.event);
            } };

      // init shorthand variables
      this.#access = {token: token.access_token,
                      expiration: parseInt(token.expires)};
      this.#refresh = { token: token.refresh_token,
                        expiration: parseInt(token.refresh_token_expires_in) };
      this.#username = token.username;
      // add access token url to base
      this.#url = tokenSettings.url + '/sharing/rest/oauth2/token';
      this.#clientId = tokenSettings.client_id;
    }
  }

  // call constructor from build pattern
  static build(){
    // async build
    return new Promise((resolve, reject) => {
      // validate access token from AGO Social Auth
      if(drupalSettings.hasOwnProperty('ago_access_token')
          && drupalSettings.ago_access_token != null
          && drupalSettings.ago_access_token.hasOwnProperty('token')){
        // build manager object for ago rest api
        const agoIdMgr = arcgisRest.ArcGISIdentityManager,
              tokenSettings = drupalSettings.ago_access_token;
        const token = tokenSettings.token;

        // build ago id manager from social auth token
        agoIdMgr
          .fromToken({clientId: tokenSettings.client_id,
                      portal: tokenSettings.url + '/sharing/rest',
                      token: token.access_token,
                      tokenExpires: token.expires,
                      username: token.username})
            // pass new manager to constructor
          .then(mgr => resolve(new Agocms(mgr)),
            // pass no manager to constructo to make invalid api
            reject(new Agocms()));
      } else {
        // construct and return invalid class
        reject(new Agocms());
      }
    })
  }

  // async return access token as string
  getToken(){
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
            () => resolve(agocms.#access.token), {once : true});
      } else {
        // check token expiration
        if(agocms.#isAccessTokenExpired()){
          // get new token
          agocms.#refreshToken().then(() => resolve(agocms.#access.token));
        } else {
          // get the token we have
          resolve(agocms.#access.token);
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
      agocms.getToken().then(token => {
        // if params already set, update token, else set token as params
        if(conf.hasOwnProperty('params')){
          conf.params.token = token;
        } else {
          conf.params = {token};
        }

        // always set hide token and max url length. Worst case irrelevant and ignored
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
    // context
    const agocms = this;
    // get current timestamp. Ago uses seconds
    // https://stackoverflow.com/questions/3367415/get-epoch-for-a-specific-date-using-javascript
    const nowAgoFmt = new Date().getTime() / 1000;
    // allow 10 seconds between expiration and renewal
    return nowAgoFmt >= agocms.#access.expiration + 10;
  }

  #refreshToken() {
    // context
    const agocms = this;

    // lock and broadcast lock to any other open tabs
    this.#locked = true;
    this.#ch.postMessage({event: 'lock'});

    // async
    return new Promise((resolve, reject) => {
      // get new token from ago
      arcgisRest.fetchToken(agocms.#url,
          { httpMethod: 'POST',
            params: {
              client_id: agocms.#clientId,
              grant_type: 'exchange_refresh_token',
              redirect_uri: window.location,
              refresh_token: agocms.#refresh.token }})
        .then(newToken => {
          // validate response
          if(newToken.hasOwnProperty('token')){
            // convert to seconds
            newToken.expires = Math.floor(newToken.expires.getTime() / 1000);
            newToken.refreshTokenExpires = Math.floor(
                    newToken.refreshTokenExpires.getTime() / 1000);

            // update session token
            jQuery.post('/agocms/token/update', newToken).then(savedToken => {
                // update local ref
                agocms.#updateTokenRefs(savedToken);

                // notify all other windows to unlock
                agocms.#ch.postMessage({event: 'unlock', token_data: savedToken});

                // return new token from settings
                resolve(agocms.#access.token);
              }, err => console.error(err));
          } else {
            // warn user
            console.error('Token refresh failed.', agocms.#url);
          }
        })
    });
  }

  #updateTokenRefs(token) {
    // init shorthand variables
    this.#access.token = token.access_token;
    this.#access.expiration = parseInt(token.expiration);
    this.#refresh.token = token.refresh_token;
    this.#refresh.expiration = parseInt(token.refresh_token_expires_in);

    // unlock
    this.#locked = false;

    // dispatch window event
    window.dispatchEvent(this.#ev_updatedToken);
  }
}

(function (Drupal, drupalSettings){
  // build window event for setting up agocms
  const ev_agocmsLoaded = new Event('agocms_loaded');

  // try building and add global reference on fail or success
  Agocms.build().finally(obj => {
        agocms = obj;
        // notify event listeners agocms is ready
        window.dispatchEvent(ev_agocmsLoaded);
      });
})(Drupal, drupalSettings);
