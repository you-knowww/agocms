<?php
namespace Drupal\agocms\Controller;

class AgocmsController {
  public function welcome() {
    return array(
      '#markup' => 'Welcome to our Website.'
    );
  }
}
