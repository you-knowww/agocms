<?php
namespace Drupal\agocms\Plugin\Field\FieldWidget;

use Drupal\Core\Field\FieldItemListInterface;
use Drupal\Core\Field\WidgetBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Plugin implementation of the 'agocms_feature_layer_select_w' widget.
 *
 * @FieldWidget(
 *   id = "agocms_view_config_w",
 *   module = "agocms",
 *   label = @Translation("AGO CMS: View Config - Widget"),
 *   description = @Translation("Use AGO credentials to search and select layer and their relaitonships to other views."),
 *   field_types = { "agocms_view_config" },
 *   multiple_values = FALSE,
 * )
 */
// https://api.drupal.org/api/drupal/developer%21topics%21forms_api_reference.html/7.x
class AgocmsViewConfigWidget extends WidgetBase {
  /**
   * {@inheritdoc}
   */
  public function formElement(FieldItemListInterface $items, $delta, array $element, array &$form, FormStateInterface $form_state) {
    /*
      single config input hidden and disable from view. form
      builds config in JSON and updates hidden field.
    */
    $tpl_form = ['#theme' => 'view_config_form'];

    $element += [
      '#type' => 'textarea',
      '#title' => $this->t('View Config'),
      '#attributes' => [
        'class' => ['agocms-conf__input'],
        'readonly' => 'readonly',
        'id' => 'agocms-view-conf',
        'style' => 'display: none;'],
      '#attached' => ['library' => ['agocms/view-conf']],
      '#suffix' => \Drupal::service('renderer')->renderPlain($tpl_form)
    ];

    return ['value' => $element];
  }
}
