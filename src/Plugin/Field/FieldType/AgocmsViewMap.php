<?php
// https://www.drupal.org/docs/creating-custom-modules/creating-custom-field-types-widgets-and-formatters/create-a-custom-field-type
namespace Drupal\agocms\Plugin\Field\FieldType;

use Drupal\Core\Field\FieldItemBase;
use Drupal\Core\Field\FieldStorageDefinitionInterface;
use Drupal\Core\TypedData\DataDefinition;

/**
 * Provides a field type of AGO CMS Feature Layer Select.
 *
 * @FieldType(
 *   id = "agocms_view_map",
 *   label = @Translation("View ESRI data in map."),
 *   module = "agocms",
 *   default_widget = "agocms_view_map_config_w",
 *   default_formatter = "agocms_view_map"
 * )
 */

class AgocmsFeatureLayerSelect extends FieldItemBase {
  /**
    * {@inheritdoc}
    */
  public static function schema(FieldStorageDefinitionInterface $field_definition) {
    return [
      'columns' => [
        'view_map_layers' => [
          'type' => 'mapping',
          'mapping' => [
            'layer' => ['type' => 'text', 'size' => 'normal', 'not null' => FALSE]
            'fields' => [
              'type' => 'mapping',
              'allow_attribute_edit' => ['type' => 'boolean'],
              'allow_geometry_edit' => ['type' => 'boolean'],
              'allow_create' => ['type' => 'boolean'],
              'allow_delete' => ['type' => 'boolean'],
              'mapping' => [
                'field' => ['type' => 'text', 'size' => 'normal', 'not null' => FALSE],
                'is_disabled' => ['type' => 'boolean'],
                'is_hidden' => ['type' => 'boolean'],
                'is_label' => ['type' => 'boolean'],
                'is_group_id' => ['type' => 'boolean'],
              ]
            ]
          ]
        ]
      ]
    ];
  }

  /**
   * {@inheritdoc}
   */
  public static function propertyDefinitions(FieldStorageDefinitionInterface $field_definition) {
    $properties = [];

    // default layer URL and field name
    $properties['layer'] = DataDefinition::create('string')
      ->setLabel(t('https://arcgis.com/example/layer/11'));

    $properties['field'] = DataDefinition::create('string')
      ->setLabel(t('Example_Field_Name'));

    return $properties;
  }

  /**
   * {@inheritdoc}
   */
  public function isEmpty() {
    // check if layer and field are empty
    $layerValue = $this->get('layer')->getValue();
    $fieldValue = $this->get('field')->getValue();

    // check if both are null or empty
    return ($layerValue === NULL || $layerValue === '')
        && ($fieldValue === NULL || $fieldValue === '');
  }
}
