define('a', [], {})
define('c', [], {})
define('b', [], {})
define('f', [], {})
define('e', [], {})
define('x', [], {})

define('main',[], function(require, exports, module) {

  var a = "never-ending line\\";
  a ='\\';
  a = 1 / 2; //require("a2")

  a = 1 / 2
  require("./a")
  //require("b2")

  require('c');
  require  ('b')
  require("b");
  var o = {
    require: function() {
    },
    f:require('./f')
  };
  o.require('d');
  o.require(require('e'   ));

  var $require = function() {};
  $require('$require');

  var xrequire = function() {};
  xrequire('xrequire');

  /**
   * @fileoverview Module authoring format.
   */

  var define = function() {
    // some comment
    var reg = /.*/g; // comment */
  }

  /* ok, I will disappear. */
  var s = '// i am string'; require('./x');
  var t = 'i am string too'; // require('z');

  /* will not // be removed */ var xx = 'a';

  //
  //     var Calendar = require('calendar');

  var str = " /* not a real comment */ ";
  var regex = /\/*.*/;
  var tt = '"\'';

  var xxxx = 'require("show_me_the_money")';

  var r = /\/*require('r')*/;
  var r2 = /require('r2')/;
  var weird = / \/\/ \/b\//g;

  exports.name = 'main'
});

require(['main'], function (main) {
  console.log(main.name)
  console.log('No error occurs.')
});