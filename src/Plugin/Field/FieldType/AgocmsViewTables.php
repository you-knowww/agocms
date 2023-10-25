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
    return ['columns' => ['conf' => ['type' => 'text', 'size' => 'big', 'not null' => FALSE]]];
  }

  /**
   * {@inheritdoc}
   */
  public static function propertyDefinitions(FieldStorageDefinitionInterface $field_definition) {
    // empty array init
    $properties = ['conf' => DataDefinition::create('string')
      ->setLabel(t('{layers: [{url: "https://example.layer.dot.com/12345"}]}'))];
    return $properties;
  }

  /**
   * {@inheritdoc}
   */
  public function isEmpty() {
    // check if there are any definined layers
    $conf = $this->get('conf');

    // check if both are null or empty
    return $conf === NULL || $conf === '';
  }
}
