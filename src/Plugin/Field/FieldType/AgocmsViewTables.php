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
 *   id = "agocms_view_tables",
 *   label = @Translation("View ESRI data in table."),
 *   module = "agocms",
 *   default_widget = "agocms_view_table_config_w",
 *   default_formatter = "agocms_view_table"
 * )
 */

class AgocmsViewTables extends FieldItemBase {
  /**
    * {@inheritdoc}
    */
  public static function schema(FieldStorageDefinitionInterface $field_definition) {
    return [
      'columns' => [
        'view_map_layers' => [
          'type' => 'map',
          'mapping' => [
            'layer' => ['type' => 'text', 'size' => 'normal'],
            'allow_create' => ['type' => 'boolean'],
            'allow_delete' => ['type' => 'boolean'],
            'fields' => [
              'type' => 'map',
              'mapping' => [
                'field' => ['type' => 'text', 'size' => 'normal'],
                'is_disabled' => ['type' => 'boolean'],
                'is_hidden' => ['type' => 'boolean'],
                'is_group_id' => ['type' => 'boolean'],
              ]
            ],
            'relationships' => [
              'type' => 'map',
              'mapping' => [
                'layer' => ['type' => 'text', 'size' => 'normal'],
                'attribute' => [
                  'type' => 'map',
                  'mapping' => [
                    'field_1' => ['type' => 'text', 'size' => 'normal'],
                    'field_2' => ['type' => 'text', 'size' => 'normal'],
                    'operator' => [
                      'type' => 'list_string',
                      'sequence' => [
                        '=' => '[Layer_1] [field_1] = [layer_2] [field_2]',
                        '>' => '[Layer_1] [field_1] > [layer_2] [field_2]',
                        '=>' => '[Layer_1] [field_1] => [layer_2] [field_2]',
                        '<' => '[Layer_1] [field_1] < [layer_2] [field_2]',
                        '<=' => '[Layer_1] [field_1] <= [layer_2] [field_2]',
                        '!=' => '[Layer_1] [field_1] does NOT = [layer_2] [field_2]',
                      ]
                    ],
                  ]
                ],
                'geometry' => [
                  'type' => 'list_string',
                  'sequence' => [
                    'disabled' => 'disabled',
                    'overlap' => 'overlap',
                    '1_contains_2' => '[Layer_1] contains [layer_2]',
                    '2_contains_1' => '[Layer_1] is contained by [layer_2]'
                  ]
                ],
                'is_disabled' => ['type' => 'boolean']
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
