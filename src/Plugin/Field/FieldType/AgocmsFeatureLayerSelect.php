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
 *   id = "agocms_feature_layer_select",
 *   label = @Translation("AGO CMS Feature Layer Select"),
 *   module = "agocms",
 *   default_widget = "agocms_feature_layer_select_w",
 *   default_formatter = "agocms_feature_layer_select_f"
 * )
 */

class AgocmsFeatureLayerSelect extends FieldItemBase {
  /**
    * {@inheritdoc}
    */
  public static function schema(FieldStorageDefinitionInterface $field_definition) {
    return [
      'columns' => [
        'value' => ['type' => 'text', 'size' => 'normal', 'not null' => FALSE]
      ]
    ];
  }

  /**
   * {@inheritdoc}
   */
  public static function propertyDefinitions(FieldStorageDefinitionInterface $field_definition) {
    $properties = [];

    $properties['value'] = DataDefinition::create('string')
      ->setLabel(t('https://arcgis.com/example/layer/11'));

    return $properties;
  }

  /**
   * {@inheritdoc}
   */
  public function isEmpty() {
    $value = $this->get('value')->getValue();
    return $value === NULL || $value === '';
  }
}
