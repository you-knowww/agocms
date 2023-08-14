class Agocms {
  // default locked to false but check lock on init
  #locked = false;
  #access;
  #refresh;
  #user;

  constructor(){
    // context
    const agocms = this;

    // set event listener for lock and unlock
    window.addEventListener('agocms_lock_token', () => agocms.locked = true);
    window.setEventListener('agocms_unlock_token', u => agocms.updateTokenRefs(u));

    //
    // init shorthand variables
    this.access = { token: drupalSettings.hasOwnProperty('ago_access_token')
                            ? drupalSettings.hasOwnProperty.access_token : undefined,
                    expiration: drupalSettings.hasOwnProperty('ago_access_token')
                                ? drupalSettings.hasOwnProperty.expires : undefined };
    this.refresh = {token: drupalSettings.hasOwnProperty('ago_access_token')
                            ? drupalSettings.hasOwnProperty.refresh_token : undefined,
                    expiration: drupalSettings.hasOwnProperty('ago_access_token')
                                ? drupalSettings.hasOwnProperty.refresh_token_expires_in
                                : undefined };
    this.user = drupalSettings.hasOwnProperty('ago_access_token')
                ? drupalSettings.hasOwnProperty.username : undefined;
  }

  // async return access token as string
  getToken(){
    // set context
    const agocms = this;

    // async
    return new Promise((resolve, reject) => {
      // check lock
      if(agocms.locked === true){
        // set event listener on unlock
        window.setEventListener('local_token_updated',
            () => resolve(agocms.access.token));
      } else {
        // check token expiration
        if(agocms.isAccessTokenExpired()){
          // get new token
          agocms.refreshToken().then(() => resolve(agocms.access.token));
        } else {
          // get the token we have
          resolve(agocms.access.token);
        }
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
    return nowAgoFmt + 10 >= agocms.access.expiration;
  }

  #refreshToken() {
    // async
    return new Promise((resolve, reject) => {
      // lock and broadast lock to any other open tabs
      agocms.broacastLock();

      // get new token from
    });
  }

  #broadcastLock(){

  }

  #updateTokenRefs(tokenData) {
    // init shorthand variables
    this.access.token = tokenData.access_token;
    this.access.expiration: tokenData.access_expiration;
    this.refresh.token = tokenData.refresh_token;
    this.refresh.expiration: tokenData.refresh_expires;

    // fire window event
    const ev_updatedToken = new Event('local_token_updated');
    window.fire(ev_updatedToken);
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

  const agocms = new Agocms;

  agocms.getToken().then(result => console.log(result));
})(Drupal, drupalSettings);
