run.def("two",
  ["one"],
  function(one) {
    return {
      size: "small",
      color: "redtwo",
      doSomething: function() {
        return run.get("one").doSomething();
      }
    };
  }
);
