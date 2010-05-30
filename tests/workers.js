importScripts('../require.js');

require({
        baseUrl: "./"    
    },
    ["require", "simple", "dimple", "func"],
    function(require, simple, dimple, func) {
        postMessage(simple.color);
        postMessage(dimple.color);
        postMessage(func());
    }
);
