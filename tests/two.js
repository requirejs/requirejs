run(
  "two",
  ["one"],
  function(one) {
    return {
      size: one.size,
      color: "redtwo",
      doSomething: function() {
        return one.doSomething();
      }
    };
  }
);
