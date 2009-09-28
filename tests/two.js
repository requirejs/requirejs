run(
  "tests.two",
  ["tests.one"],
  function(one) {
    return {
      size: one.size,
      color: "redtwo",
      doSomething: function() {
        log("In two's doSomething, calling one.doSomething");
        one.doSomething();
      }
    };
  }
);
