//Common functions for the test files. *MUST* be included after run.js.

(function() {
  var messages = [];
  var bodyReady = false;

  window.log = function(message) {
    if (typeof console != "undefined" && console.log) {
      console.log(message);
    } else {
      messages.push(message);
      if (bodyReady) {
        dumpLogs();
      }
    }
  }

  function dumpLogs() {
    bodyReady = true;
    if (messages.length) {
      var body = document.getElementsByTagName("body")[0];
      if (body) {
        for (var i = 0; i < messages.length; i++) {
          var div = document.createElement("div");
          div.innerHTML = messages[i];
          body.appendChild(div);
        }
      }
      messages =[];
    }
  }

  run.ready(dumpLogs);
})();