<?php
namespace Drupal\agocms\Plugin\Field\FieldWidget;

use Drupal\Core\Field\FieldItemListInterface;
use Drupal\Core\Field\WidgetBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Render\Element;

/**
 * Plugin implementation of the 'agocms_feature_layer_select_w' widget.
 *
 * @FieldWidget(
 *   id = "agocms_feature_layer_select_w",
 *   label = @Translation("AGO CMS: Feature Layer Select - Widget"),
 *   description = @Translation("Use AGO credentials to search and select feature layer. Also accepts text path as value."),
 *   field_types = { "string", },
 *   multiple_values = FALSE,
 * )
 */

class AgocmsFeatureLayerSelectWidget extends WidgetBase {
  /**
   * {@inheritdoc}
   */
  public function formElement(FieldItemListInterface $items, $delta, array $element, array &$form, FormStateInterface $form_state) {
    $element['search'] = array(
      '#type' => 'search',
      '#title' => t('Feature Layer Search'),
      '#description' => t('Reactive search. If group or service is selected, results narrow to feature services and/or layers in the selection.'),
    );

    $element['textfield'] = array(
      '#type' => 'textfield',
      '#title' => t('Path'),
      '#description' => t('Paste or type direct path to feature service. Will verify after 2 second delay.'),
    );

    //setting default value to all fields from above
    $children = Element::children($element);

    foreach ($children as $child) {
      $element[$child]['#default_value'] = isset($items[$delta]->{$child}) ? $items[$delta]->{$child} : NULL;
    }

    return $element;
  }
}
