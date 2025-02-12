<?php
namespace Drupal\agocms\Plugin\Field\FieldFormatter;

use Drupal\Core\Field\FormatterBase;
use Drupal\Core\Field\FieldItemListInterface;

/**
 * Plugin implementation of the 'agocms_view_config' formatter.
 *
 * @FieldFormatter(
 *   id = "agocms_view_config",
 *   label = @Translation("View Config"),
 *   field_types = {
 *     "agocms_view_config"
 *   }
 * )
 */
class AgocmsViewConfigFormatter extends FormatterBase {
  /**
   * {@inheritdoc}
   */
  public function settingsSummary() {
    $summary = [];
    $summary[] = $this->t('Config view of feature layers.');
    return $summary;
  }

  /**
   * {@inheritdoc}
   */
  public function viewElements(FieldItemListInterface $items, $langcode) {
    // ref
    $tpl_view = ['#theme' => 'view'];
    $el = [];

    // only one json field to show and attach ref to drupal settings
    if(count($items) > 0 && $items[0]->value != null){
      // show on page
      $el[0] = ['#markup' => \Drupal::service('renderer')->renderPlain($tpl_view)];
      // if items available attach only expected val as drupal setting
      $el['#attached']['drupalSettings']['agocms']['conf'] = json_decode($items[0]->value);
      $el['#attached']['library'] = ['agocms/view'];
    }

    return $el;
  }
}
