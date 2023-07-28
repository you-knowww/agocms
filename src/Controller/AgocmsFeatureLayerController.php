<?php
namespace Drupal\agocms\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\Component\Utility\Xss;

/**
 * Defines a route controller for watches autocomplete form elements.
 */
class AgocmsFeatureLayerController extends ControllerBase {
  /**
   * The node storage.
   *
   * @var \Drupal\node\NodeStorage
   */
  protected $nodeStorage;

  /**
   * Handler for autocomplete request.
   */
  public function configSearch(Request $request) {
    /*$results = [];
    $input = $request->query->get('q');

    // Get the typed string from the URL, if it exists.
    if (!$input) {
      return new JsonResponse($results);
    }

    $input = Xss::filter($input);
    */

    $results[] = [
      'value' => 'Test 1',
      'label' => 'Test 1 lbl',
    ];
    $results[] = [
      'value' => 'Test 2',
      'label' => 'Test 2 lbl'
    ];
    $results[] = [
      'value' => 'Test 3',
      'label' => 'Test 3 lbl'
    ];

    return new JsonResponse($results);
  }
}
