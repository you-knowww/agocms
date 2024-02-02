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
 *   id = "agocms_view_config",
 *   label = @Translation("View ESRI data"),
 *   module = "agocms",
 *   default_widget = "agocms_view_config_w",
 *   default_formatter = "agocms_view_config"
 * )
 */

class AgocmsViewConfig extends FieldItemBase {
  /**
    * {@inheritdoc}
    */
  public static function schema(FieldStorageDefinitionInterface $field_definition) {
    return ['columns' => ['value' => ['type' => 'blob','size' => 'big', 'not null' => FALSE]]];
  }

  /**
   * {@inheritdoc}
   */
  public static function propertyDefinitions(FieldStorageDefinitionInterface $field_definition) {
    // empty array init
    $properties = ['value' => DataDefinition::create('string')->setLabel(t('Config'))];
    return $properties;
  }

  /**
   * {@inheritdoc}
   */
  public function isEmpty() {
    // check if there are any definined layers
    $val = $this->get('value')->getValue();

    // check if both are null or empty
    return $val === NULL || $val === '';
  }
}
