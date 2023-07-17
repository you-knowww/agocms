<?php
namespace Drupal\agocms\Plugin\Network;

use Drupal\Core\Url;
use Drupal\social_api\SocialApiException;
use Drupal\social_auth\Plugin\Network\NetworkBase;
use Drupal\social_auth_ago\Settings\AgoAuthSettings;
use League\OAuth2\Client\Provider\GenericProvider;

/**
 * Defines Social Auth ArcGIS Online Network Plugin.
 *
 * This is the main definition of the Network Plugin. The most important
 * properties are listed below.
 *
 * id: The unique identifier of this Network Plugin. It must have the same name
 * as the module itself.
 *
 * social_network: The Social Network for which this Network Plugin is defined.
 *
 * type: The type of the Network Plugin:
 * - social_auth: A Network Plugin for user login/registration.
 * - social_post: A Network Plugin for autoposting tasks.
 * - social_widgets: A Network Plugin for social networks' widgets.
 *
 * handlers: Defined the settings manager and the configuration identifier
 * in the configuration manager. In detail:
 *
 * - settings: The settings management for this Network Plugin.
 *   - class: The class for getting the configuration data. The settings
 *     property of this class is the instance of the class declared in this
 *     field.
 *   - config_id: The configuration id. It usually is the same used by the
 *     configuration form.
 *
 * @see \Drupal\social_auth_ago\Form\AgoAuthSettingsForm
 *
 * @Network(
 *   id = "agocms",
 *   social_network = "ArcGIS Online",
 *   type = "social_auth",
 *   handlers = {
 *      "settings": {
 *          "class": "\Drupal\agocms\Settings\AgoAuthSettings",
 *          "config_id": "agocms.settings"
 *      }
 *   }
 * )
 */
class AgoAuth extends NetworkBase {
  /**
   * {@inheritdoc}
   *
   * Initializes the ArcGIS Online REST services to request accounts.
   *
   * The returning value of this method is what is returned when an instance of
   * this Network Plugin called the /self endpoint.
   *
   * @see \Drupal\social_auth_ago\Controller\AgoAuthController::callback
   * @see \Drupal\social_auth\Controller\OAuth2ControllerBase::processCallback
   */
  public function initSdk() {
    /** @var \Drupal\agocms\Settings\AgoAuthSettings $settings */
    $settings = $this->settings;

    if ($this->validateConfig($settings)) {
      // All these settings are mandatory.
      $settings = [
        'urlAuthorize' => $settings->getAuthorizationUrl(),
        'urlAccessToken' => $settings->getAccessTokenUrl(),
        'urlResourceOwnerDetails' => 'jm',
        'clientId' => $settings->getClientId(),
        'clientSecret' => $settings->getClientSecret(),
        'redirectUri' => Url::fromRoute('agocms.callback')->setAbsolute()->toString(),
        'verify' => FALSE,
      ];

      return new GenericProvider($settings);
    }

    return FALSE;
  }

  /**
   * Checks that module is configured.
   *
   * @param \Drupal\social_auth_ago\Settings\AgoAuthSettings $settings
   *   The implementer authentication settings.
   *
   * @return bool
   *   True if module is configured.
   *   False otherwise.
   */
  protected function validateConfig(AgoAuthSettings $settings) {
    $client_id = $settings->getClientId();
    $client_secret = $settings->getClientSecret();
    if (!$client_id || !$client_secret) {
      $this->loggerFactory
        ->get('social_auth_ago')
        ->error('Define Client ID and Client Secret on module settings.');

      return FALSE;
    }

    return TRUE;
  }
}
