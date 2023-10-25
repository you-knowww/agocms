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
// https://api.drupal.org/api/drupal/developer%21topics%21forms_api_reference.html/7.x
class AgocmsViewTablesWidget extends WidgetBase {
  /**
   * {@inheritdoc}
   */
  public function formElement(FieldItemListInterface $items, $delta, array $element, array &$form, FormStateInterface $form_state) {
    /*
      single config input hidden and disable from view. form
      builds config in JSON and updates hidden field.
    */
    $tpl_form = ['#theme' => 'view_tables_conf_form'];

    $element['conf'] = array(
      '#type' => 'textfield',
      '#title' => $this->t('Tables View Config'),
      '#attributes' => ['style' => 'display: none;', 'disabled' => 'disabled',
          'id' => 'agocms-view-tables-conf', 'class' => ['agocms-view-conf__input']],
      '#attached' => ['library' => ['agocms/view-conf']],
      '#suffix' => \Drupal::service('renderer')->renderPlain($tpl_form)
    );

    return $element;
    // $parsed_field_name = str_replace(' ', '-', $element['#title']);
  }
}
