class Agocms {
  // invalidate if there is no ago access token from login
  #valid = true;
  // default locked to false but check lock on init
  #locked = false;
  // objects
  #access;
  #refresh;
  // ago username
  #user;
  // base url and client id for token refresh
  #url;
  #clientId;
  // manage events across context in origin. const
  #ch = new BroadcastChannel('agocms');
  // local event listener to dispatch after updating local creds. const
  #ev_updatedToken = new Event('local_token_updated');

  constructor(){
    // context
    const agocms = this;

    // validate access token from AGO Social Auth
    if(drupalSettings.hasOwnProperty('ago_access_token')
          && drupalSettings.ago_access_token != null
          && drupalSettings.ago_access_token.hasOwnProperty('token')){
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
      this.#user = token.username;
      // add access token url to base
      this.#url = tokenSettings.url + '/sharing/rest/oauth2/token';
      this.#clientId = tokenSettings.client_id;
    } else {
      // invalidate the entire thing and throw error
      this.#valid = false;
      console.error('invalid ON messag');
    }
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
        // set event listener on unlock
        window.setEventListener('local_token_updated',
            () => resolve(agocms.#access.token));
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
  // add global reference
  agocms = new Agocms;
})(Drupal, drupalSettings);
