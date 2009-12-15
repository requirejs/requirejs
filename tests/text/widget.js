run(
  "widget",
  ["subwidget", "text!widget!html"],
  function(subwidget, template) {
    return {
      subWidgetName: subwidget.name,
      subWidgetTemplate: subwidget.template,
      template: template
    };
  }
);
