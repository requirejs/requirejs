require.def("dos",
  ["tres"],
  function(tres) {
    return {
      name: "dos",
      doSomething: function() {
        return {
          tresName: tres.name
        };
      }
    };
  }
);
