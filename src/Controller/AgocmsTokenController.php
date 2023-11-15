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

    // add frontend references. copy some permanent values
    $old_token = $session->get('ago_access_token');

    $new_token = (object)array(
        'token' => $request->request->get('token'),
        'expires' => $request->request->get('expires'),
        'refresh_token' => $request->request->get('refresh_token'),
        'refresh_expires' => $request->request->get('refresh_expires'),
        'username' => $old_token->username,
        'url' => $old_token->url,
        'client_id' => $old_token->client_id);

    // add reference to auth url for frontend
    $session->set('ago_access_token', $new_token);

    // respond to client
    return new JsonResponse($new_token->token);
  }
}
