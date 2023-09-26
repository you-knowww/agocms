<?php
namespace Drupal\agocms\Plugin\Field\FieldFormatter;

use Drupal\Core\Field\FormatterBase;
use Drupal\Core\Field\FieldItemListInterface;

/**
 * Plugin implementation of the 'agocms_feature_layer_select' formatter.
 *
 * @FieldFormatter(
 *   id = "agocms_feature_layer_select_f",
 *   label = @Translation("Feature Layer"),
 *   field_types = {
 *     "agocms_feature_layer_select"
 *   }
 * )
 */
class AgocmsFeatureLayerFormatter extends FormatterBase {
  /**
   * {@inheritdoc}
   */
  public function settingsSummary() {
    $summary = [];
    $summary[] = $this->t('Feature Layer URL.');
    return $summary;
  }

  /**
   * {@inheritdoc}
   */
  public function viewElements(FieldItemListInterface $items, $langcode) {
    $elements = [];

    foreach ($items as $delta => $item) {
      $elements[$delta] = [
        // create a render array to produce markup
        // See theme_html_tag().
        '#type' => 'html_tag',
        '#tag' => 'p',
        '#value' => $this->t('Feature Layer URL: @code', ['@code' => $item->value]),
      ];
    }

    return $elements;
  }
}
