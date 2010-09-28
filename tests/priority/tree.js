require.def("bark", function () {
    return {
        name: "bark"
    };
});

var globalLeafNameForTree = globalLeafName;

require.def("tree", ["leaf", "bark"], function () {
   return {
        name: "tree",
        leafName: globalLeafNameForTree,
        barkName: bark.name
   };
});
