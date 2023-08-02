<?php
namespace Drupal\agocms\Plugin\Field\FieldWidget;

use Drupal\Core\Field\FieldItemListInterface;
use Drupal\Core\Field\WidgetBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Plugin implementation of the 'agocms_feature_layer_select_w' widget.
 *
 * @FieldWidget(
 *   id = "agocms_feature_layer_select_w",
 *   module = "agocms",
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
    $element['feature_layer_select'] = array(
      '#type' => 'textfield',
      '#title' => t('Path'),
      '#description' => t('Paste or type path to feature service. Will verify after 2 second delay.'),
      '#attributes' => ['class' => [ 'agocms-featurelayer-select__input'] ],
      '#attached' => ['library' => ['agocms/feature-layer-select']],
      // '#default_value' => ''
    );

    return $element;
  }
}
