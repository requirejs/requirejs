run(
  "subwidget",
  ["text!subwidget!html!sanitize"],
  function(template) {
    return {
      name: "subwidget",
      template: template
    };
  }
);
