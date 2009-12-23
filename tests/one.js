run(
  "one",
  ["run", "two"],
  function(run) {
    var one = {
      size: "large",
      doSomething: function() {
        return run.get("two");
      }
    };

    return one;
  }
);
