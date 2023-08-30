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
      this.#access = { token: token.access_token, expiration: token.expires };
      this.#refresh = { token: token.refresh_token,
                        expiration: token.refresh_token_expires_in };
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
        //if(agocms.#isAccessTokenExpired()){
          // get new token
          agocms.#refreshToken().then(() => resolve(agocms.#access.token));
        //} else {
          // get the token we have
          //resolve(agocms.#access.token);
        //}
      }
    });
  }

  // return bool
  #isAccessTokenExpired(){
    // context
    const agocms = this;
    // get current timestamp. Ago uses seconds
    // https://stackoverflow.com/questions/3367415/get-epoch-for-a-specific-date-using-javascript
    const nowAgoFmt = new Date().getTime() / 1000;
    // allow 10 seconds between expiration and renewal
    return nowAgoFmt + 10 >= agocms.#access.expiration;
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
        .then(response => {
          // validate response
          if(response.hasOwnProperty('token')){
            // update session token
            jQuery.post('/agocms/token/update', response)
              .then(newToken => {
                // update local
                agocms.#updateTokenRefs(newToken);

                // notify all other windows to unlock
                agocms.#ch.postMessage({event: 'unlock', token_data: newToken});

                // return new token from settings
                resolve(agocms.#access.token);
              }, response => console.error(response));
          } else {
            // warn user
            console.error('Token refresh failed.', agocms.#url);
          }
        })
    });
  }

  #updateTokenRefs(tokenData) {
    console.log('token updating:', tokenData);

    // init shorthand variables
    this.#access.token = tokenData.access_token;
    this.#access.expiration = tokenData.expiration;
    this.#refresh.token = tokenData.refresh_token;
    this.#refresh.expiration = tokenData.refresh_token_expires_in;

    console.log('token updated:', this);

    // unlock
    this.#locked = false;

    // dispatch window event
    window.dispatchEvent(this.#ev_updatedToken);
  }
}

(function (Drupal, drupalSettings){
 // console.log('pretest');
  /*
    arcgisRest
      .getSelf(
        { hideToken: true,
          params: { token: drupalSettings.ago_access_token.access_token }})
      .then(response => console.log(response));
    const testQ = new arcgisRest.SearchQueryBuilder().match('private').in('access');
    console.log(testQ)
    arcgisRest
      .searchGroups(
        { q: testQ,
          hideToken: true,
          params: { token: drupalSettings.ago_access_token.access_token }})
      .then(response => console.log(response));
  */

  console.log('test');
  const agocms = new Agocms;
  // console.log(drupalSettings);
  // console.log(agocms);
  agocms.getToken().then(result => {
      console.log(result)
    },
    err => console.error(err));
})(Drupal, drupalSettings);
