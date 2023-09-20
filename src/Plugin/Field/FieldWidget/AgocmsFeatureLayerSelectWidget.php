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
    // use field name and replace spaces with hyphens to keep datalists field specific
    $parsed_field_name = str_replace(' ', '-', $element['#title']);

    // get html for feature layer search fields
    $tpl_layer_search = ['#theme' => 'layer_search', '#field_name' => $parsed_field_name];

    // input field for URL for DB
    $element['feature_layer_select_input'] = array(
      '#type' => 'textfield',
      '#title' => t('Path'),
      '#description' => t('Paste Feature Layer url directly or use search below.'),
      '#attributes' => ['class' => ['agocms-featurelayer-select__input'],
        'id' => 'agocms-featurelayer-select-input-'. $parsed_field_name],
      '#attached' => ['library' => ['agocms/feature-layer-select']],
      '#suffix' => \Drupal::service('renderer')->renderPlain($tpl_layer_search));
    /*
    // input field for group search
    $element['feature_layer_select_group_search'] = array(
      '#type' => 'textfield',
      '#title' => t('Group'),
      '#description' => t('Search or Browse AGO Groups to narrow Feature Service results.'),
      '#attributes' => ['class' => ['agocms-featurelayer-select-group-search'],
        // reference this field so there can be multiple valid datalist field connections
        'list' => 'agocms-featurelayer-select-group-search-'. $parsed_field_name,
        'd-field-name' => $parsed_field_name],
      '#suffix' => t('<datalist id="agocms-featurelayer-select-group-search-'
                      . $parsed_field_name .'"></datalist>'));

    // input field for feature service search
    $element['feature_layer_select_service_search'] = array(
      '#type' => 'textfield',
      '#title' => t('Service'),
      '#description' => t('Search Feature Services or select a Group to browse.<br/>
      Select a Feature Service to list Feature Layers.'),
      '#attributes' => ['class' => ['agocms-featurelayer-select-service-search'],
        'list' => 'agocms-featurelayer-select-service-search-'. $parsed_field_name,
        'd-field-name' => $parsed_field_name],
      '#suffix' => t('<datalist id="agocms-featurelayer-select-service-search-'
                      . $parsed_field_name .'"></datalist>'));

    // input field for feature service search
    $element['feature_layer_select_layer_select'] = array(
      '#type' => 'select',
      '#title' => t('Layer'),
      '#description' => t('Select Layer from Feature Service.'),
      '#attributes' => ['class' => ['agocms-featurelayer-select-layer-select'],
        'id' => 'agocms-featurelayer-select-layer-select-'. $parsed_field_name,
        'd-field-name' => $parsed_field_name]);
    */

    return $element;
  }
}
