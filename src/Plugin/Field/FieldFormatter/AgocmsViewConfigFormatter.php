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
    $element = [];


    foreach ($items as $delta => $item) {
      // Render each element as markup.
      $element[$delta] = ['#markup' => $item->value];
    }

    return $element;
    /*
    foreach ($items as $delta => $item) {
      $elements[$delta] = [
        // create a render array to produce markup
        // See theme_html_tag().
        '#type' => 'html_tag',
        '#tag' => 'p',
        '#value' => $this->t('Test view.'),
      ];
    }

    return $elements;
    */
  }
}
