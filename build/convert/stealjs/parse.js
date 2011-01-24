/*jslint plusplus: false */
/*global define: false */
"use strict";

/**
 * An override for the jslib/parse.js to convert stealjs calls into
 * require/define calls.
 */

define(['../../jslib/parse'], function (baseParse) {

    var parse = baseParse,
        allowedCalls = {
            plugins: true,
            views: true
        };

    function hasStealCall(node) {
        if (!baseParse.isArray(node)) {
            return false;
        }

        if (node[0] === 'name' && node[1] === 'steal') {
            return true;
        } else if (node[0] === 'call' && node[1][0] === 'dot') {
            return hasStealCall(node[1][1]);
        }

        return false;
    }

    function addStringsToArray(node, array) {
        var i, item;
        for (i = 0; i < node.length; i++) {
            item = node[i];
            if (item && baseParse.isArray(item) && item[0] === 'string') {
                array.unshift(item[1]);
            }
        }
    }

    function generateRequireCall(node, array) {
        //Need to unwind the call since the dot access shows up funny
        //in the AST.
        var args = node[node.length - 1],
            previous = node[node.length - 2],
            call = previous[previous.length - 1];

        if (typeof call === 'string' && allowedCalls[call]) {
            if (call === 'plugins') {
                addStringsToArray(args, array);
            } else if (call === 'views') {
                //special work in  here.
            }

            //Find out if there are any other chained calls.
            previous = previous[previous.length - 1];
            previous = previous[previous.length - 1];

            generateRequireCall(previous, array);
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

debugger;
        if (hasStealCall(node)) {
            value = [];
            generateRequireCall(node, value);
            return "require(" + JSON.stringify(value) + ");";
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

*/

    return parse;
});
