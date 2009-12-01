run(
  "one",
  ["two"],
  function(two) {
    return {
      size: "large",
      doSomething: function() {
        return {
          size: two.size,
          color: two.color
        };
      }
    };
  }
);
