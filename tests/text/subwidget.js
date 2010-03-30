require.def("subwidget",
  ["text!subwidget.html!strip", "text!subwidget2.html!<span>This! is template2</span>"],
  function(template, template2) {
    return {
      name: "subwidget",
      template: template,
      template2: template2
    };
  }
);
