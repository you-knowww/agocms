<?php
namespace Drupal\agocms\Plugin\Field\FieldFormatter;

use Drupal\Core\Field\FormatterBase;
use Drupal\Core\Field\FieldItemListInterface;

/**
 * Plugin implementation of the 'agocms_view_map' formatter.
 *
 * @FieldFormatter(
 *   id = "agocms_view_map",
 *   label = @Translation("View Map"),
 *   field_types = {
 *     "agocms_view_map"
 *   }
 * )
 */
class AgocmsViewMapFormatter extends FormatterBase {
  /**
   * {@inheritdoc}
   */
  public function settingsSummary() {
    $summary = [];
    $summary[] = $this->t('Map of feature layers.');
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
        '#value' => $this->t('Test map view.'),
      ];
    }

    return $elements;
  }
}
