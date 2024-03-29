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
      single hidden disabled config input. form builds config
      in JSON and updates hidden field at submit to save.
    */
    // output
    $build = [];
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

    // add reference to output here so settings can be attached
    $build['value'] = $element;

    // if items available attach only expected val as drupal setting
    if(count($items) > 0 && $items[0]->value != null){
      // convert saves string to json
      $build['#attached']['drupalSettings']['agocms']['conf']
        = json_decode($items[0]->value);
    }

    return $build;
  }
}
