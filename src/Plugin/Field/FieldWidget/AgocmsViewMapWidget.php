<?php
namespace Drupal\agocms\Plugin\Field\FieldWidget;

use Drupal\Core\Field\FieldItemListInterface;
use Drupal\Core\Field\WidgetBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Plugin implementation of the 'agocms_feature_layer_select_w' widget.
 *
 * @FieldWidget(
 *   id = "agocms_view_map_w",
 *   module = "agocms",
 *   label = @Translation("AGO CMS: View Map Config - Widget"),
 *   description = @Translation("Use AGO credentials to search and select layer and their relaitonships to other views."),
 *   field_types = { "agocms_view_map" },
 *   multiple_values = FALSE,
 * )
 */

class AgocmsViewMapWidget extends WidgetBase {
  /**
   * {@inheritdoc}
   */
  public function formElement(FieldItemListInterface $items, $delta, array $element, array &$form, FormStateInterface $form_state) {
    // use field name and replace spaces with hyphens to keep datalists field specific
    $parsed_field_name = str_replace(' ', '-', $element['#title']);

    // get html for feature layer search fields
    //$tpl_layer_search = ['#theme' => 'layer_search', '#field_name' => $parsed_field_name];
    //$tpl_layer_field_select = ['#theme' => 'layer_field_select', '#field_name' => $parsed_field_name];

    // input field for URL for DB
    $element['layer'] = array(
      '#type' => 'textfield',
      '#description' => t('Paste Feature Layer URL directly.'),
      '#attributes' => ['class' => ['agocms-featurelayer-select__input'],
        'id' => 'agocms-featurelayer-select-input-'. $parsed_field_name],
      // '#attached' => ['library' => ['agocms/feature-layer-select']],
      // '#prefix' => \Drupal::service('renderer')->renderPlain($tpl_layer_search)
    );

    // input field for layer field name
    $element['allow_create'] = array(
      '#type' => 'checkbox',
      '#description' => t('Allow users to create features.'));
    // input field for layer field name
    $element['allow_delete'] = array(
      '#type' => 'checkbox',
      '#description' => t('Allow users delete features.'));
    // input field for layer field name
    $element['allow_attribute_edit'] = array(
      '#type' => 'checkbox',
      '#description' => t('Allow users to edit feature attributes.'));
    // input field for layer field name
    $element['allow_geometry_edit'] = array(
      '#type' => 'checkbox',
      '#description' => t('Allow users to edit feature geometry.'));

    $element['field'] = array(
      '#type' => 'textfield',
      '#description' => t('Field name.'));

    $element['is_disabled'] = array(
      '#type' => 'checkbox',
      '#description' => t('Disabled'));

    $element['is_hidden'] = array(
      '#type' => 'checkbox',
      '#description' => t('Hidden'));
    return $element;
  }
}
