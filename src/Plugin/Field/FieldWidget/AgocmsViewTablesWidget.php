<?php
namespace Drupal\agocms\Plugin\Field\FieldWidget;

use Drupal\Core\Field\FieldItemListInterface;
use Drupal\Core\Field\WidgetBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Plugin implementation of the 'agocms_view_tables_w' widget.
 *
 * @FieldWidget(
 *   id = "agocms_view_tables_w",
 *   module = "agocms",
 *   label = @Translation("AGO CMS: View Tables - Widget"),
 *   description = @Translation("Use AGO credentials to search and select layers for tables."),
 *   field_types = { "agocms_view_tables" },
 *   multiple_values = FALSE,
 * )
 */

class AgocmsFeatureLayerSelectWidget extends WidgetBase {
  /**
   * {@inheritdoc}
   */
  public function formElement(FieldItemListInterface $items, $delta, array $element, array &$form, FormStateInterface $form_state) {
    // use field name and replace spaces with hyphens to keep datalists field specific
    $parsed_field_name = str_replace(' ', '-', $element['#title']);

    // get html for feature layer search fields
    // $tpl_layer_search = ['#theme' => 'layer_search', '#field_name' => $parsed_field_name];
    // $tpl_layer_field_select = ['#theme' => 'layer_field_select', '#field_name' => $parsed_field_name];

    // input field for URL for DB
    $element['layer'] = array(
      '#type' => 'textfield',
      '#description' => t('Or paste Feature Layer URL directly.'),
      '#attributes' => ['class' => ['agocms-featurelayer-select__input'],
        'id' => 'agocms-featurelayer-select-input-'. $parsed_field_name],
      '#attached' => ['library' => ['agocms/feature-layer-select']],
      '#prefix' => \Drupal::service('renderer')->renderPlain($tpl_layer_search));

    // input field for layer field name
    $element['field'] = array(
      '#type' => 'textfield',
      '#description' => t('Prepopulates with valid layer or type/paste directly.'),
      '#attributes' => ['class' => ['agocms-featurelayer-field-select__input'],
        'id' => 'agocms-featurelayer-field-select-input-'. $parsed_field_name,
        // don't apply browser history inputs
        'autocomplete'=>'off',
        'list' => 'agocms-featurelayer-field-datalist-'. $parsed_field_name],
      '#attached' => ['library' => ['agocms/feature-layer-field-select']],
      '#suffix' => \Drupal::service('renderer')->renderPlain($tpl_layer_field_select));

    return $element;
  }
}
