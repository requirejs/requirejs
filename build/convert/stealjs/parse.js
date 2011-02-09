/*jslint plusplus: false, strict: false */
/*global define: false */

/**
 * An override for the jslib/parse.js to convert stealjs calls into
 * require/define calls.
 */

define(['../../jslib/parse'], function (baseParse) {

    var parse = baseParse,
        allowedCalls = {
            plugins: true,
            views: true
        },
        viewStringRegExp = /^\/\//;

    /**
     * Finds a steal node in a nested, backwards AST tree structure.
     */
    function getStealCall(node) {
        if (!baseParse.isArray(node)) {
            return false;
        }

        if (node[0] === 'name' && node[1] === 'steal' && !node.isRequireJSParsed) {
            return node;
        } else if (node[0] === 'call') {
            if (node[1][0] === 'name' && node[1][1] === 'steal') {
                return getStealCall(node[1]);
            } else if (node[1][0] === 'dot') {
                return getStealCall(node[1][1]);
            }
        }

        return null;
    }

    /**
     * Mark the steal node tree as processed. Need to do this given the
     * backwards structure of the AST.
     */
    function markStealTreeProcessed(node) {
        getStealCall(node).isRequireJSParsed = true;
    }

    /**
     * Transform a .views depdencency to an ejs! plugin loaded depdendency
     * @param {String} value the .views string name.
     * @returns {String} an 'ejs!' string
     */
    function viewTransform(value) {
        return 'ejs!' + value.replace(viewStringRegExp, '');
    }

    function addStringsToArray(node, array, transform) {
        var i, item, matches = [];
        for (i = 0; i < node.length; i++) {
            item = node[i];
            if (item && baseParse.isArray(item) && item[0] === 'string') {
                matches.push((transform ? transform(item[1]) : item[1]));
            }
        }

        if (matches.length) {
            //Build up arguments to splice, since we need to put these
            //matches before other matches, given the backwards nature of
            //the call traversal in the AST.
            matches.unshift(0);
            matches.unshift(0);
            array.splice.apply(array, matches);
        }
    }

    function generateRequireCall(node, array) {
        if (!baseParse.isArray(node)) {
            return;
        }

        var args, previous, call;

        if (node[0] === 'call' && node[1][0] === 'name' && node[1][1] === 'steal') {
            //A simple steal() call.
            addStringsToArray(node[2], array);
        } else {
            //A chained call
            //Need to unwind the call since the dot access shows up "backwards"
            //in the AST.
            args = node[node.length - 1];
            previous = node[node.length - 2];
            call = previous[previous.length - 1];

            if (typeof call === 'string' && allowedCalls[call]) {
                if (call === 'plugins') {
                    addStringsToArray(args, array);
                } else if (call === 'views') {
                    addStringsToArray(args, array, viewTransform);
                }

                //Find out if there are any other chained calls.
                previous = previous[previous.length - 2];

                generateRequireCall(previous, array);
            }
        }
    }

    parse.oldParseNode = parse.parseNode;

    parse.parseNode = function (node) {
        var value;

        if (!this.isArray(node)) {
            return null;
        }

        //Allow files with regular define/require calls to be co-mingled
        //with StealJS APIs.
        value = this.oldParseNode(node);
        if (value) {
            return value;
        }

        if (getStealCall(node)) {
            value = [];
            generateRequireCall(node, value);
            if (value.length) {
                markStealTreeProcessed(node);
                return "require(" + JSON.stringify(value) + ");";
            } else {
                return '';
            }
        }

        return null;
    };

/*
 use console.log(JSON.stringify(node, null, '  ')) to print out AST

 Using this:
 steal.plugins('foo','bar').views('//abc/init.ejs').then(function(){})

 Has this for one of the nodes.

[
  "call",
  [
    "dot",
    [
      "call",
      [
        "dot",
        [
          "name",
          "steal"
        ],
        "plugins"
      ],
      [
        [
          "string",
          "foo"
        ],
        [
          "string",
          "bar"
        ]
      ]
    ],
    "views"
  ],
  [
    [
      "string",
      "//abc/init.ejs"
    ]
  ]
]

**************************

steal('one', 'two')

[
  "toplevel",
  [
    [
      "stat",
      [
        "call",
        [
          "name",
          "steal"
        ],
        [
          [
            "string",
            "one"
          ],
          [
            "string",
            "two"
          ]
        ]
      ]
    ]
  ]
]

*/

    return parse;
});
