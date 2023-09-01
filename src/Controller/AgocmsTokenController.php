<?php
namespace Drupal\agocms\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Defines a route controller for watches autocomplete form elements.
 */
class AgocmsTokenController extends ControllerBase {
  /**
   * The node storage.
   *
   * @var \Drupal\node\NodeStorage
   */
  protected $nodeStorage;

  /**
   * Handler for autocomplete request.
   */
  public function update(Request $request) {
    // get current session to find access token
    $request = \Drupal::request();
    $session = $request->getSession();

    // add frontend references
    $old_token = $session->get('ago_access_token');
    $token = $old_token->token;

    $new_token = (object)array(
        'token' => [
          'access_token' => $request->request->get('token'),
          'expiration' => $request->request->get('expires'),
          'refresh_token' => $request->request->get('refreshToken'),
          'refresh_token_expires_in' => $request->request->get('refreshTokenExpires') ],
        'url' => $old_token->url,
        'client_id' => $old_token->client_id);

    // add reference to auth url for frontend
    $session->set('ago_access_token', $new_token);

    // respond to client
    return new JsonResponse($new_token->token);
  }
}
