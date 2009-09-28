run(
  "tests.one",
  ["tests.two"],
  function(two) {
    return {
      size: "large",
      doSomething: function() {
        log("two's size: " + two.size + ", color: " + two.color);
      }
    };
  }
);
