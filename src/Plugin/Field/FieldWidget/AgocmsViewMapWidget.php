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
    $element['allow_delete'] = array(
      '#type' => 'checkbox',
      '#description' => t('Allow users delete features.'));
    $element['allow_attribute_edit'] = array(
      '#type' => 'checkbox',
      '#description' => t('Allow users to edit feature attributes.'));
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

    $element['label_field'] = array(
      '#type' => 'textfield',
      '#description' => t('Label field name.'));

    $element['font_size'] = array(
      '#type' => 'number',
      '#description' => t('Font size.'));
    $element['font_color'] = array(
      '#type' => 'color',
      '#description' => t('Font color.'));
    $element['background_color'] = array(
      '#type' => 'color',
      '#description' => t('Background color.'));
    $element['border_color'] = array(
      '#type' => 'color',
      '#description' => t('Border color.'));

    $element['field_1'] = array(
      '#type' => 'textfield',
      '#description' => t('Layer 1 field.'));
    $element['field_2'] = array(
      '#type' => 'textfield',
      '#description' => t('Layer 2 field.'));
    $element['operator'] = array(
      '#type' => 'select',
      '#description' => t('How layer 1 field and layer 2 field are related.'));

    $element['geometry'] = array(
      '#type' => 'select',
      '#description' => t('How layer 1 and layer 2 are spatially related.'));

    $element['allow_overwrite'] = array(
      '#type' => 'checkbox',
      '#description' => t('When matching on attribute or geometry, overwrite matched records on these fields.'));

    $element['default_layout_type'] = array(
      '#type' => 'select',
      '#description' => t('Layout pattern of points in a polygon.'));

    $element['default_layout_val'] = array(
      '#type' => 'number',
      '#description' => t('Value for variable of pattern for points in polygon.'));

    $element['buffer'] = array(
      '#type' => 'number',
      '#description' => t('Plot layout buffer around polygon edge.'));
    return $element;
  }
}
