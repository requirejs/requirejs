/*jslint strict: false, regexp: false */
/*global require: false */

/**
 * Example combo server. Requires Node 0.4+. Run it via:
 * node comoboserver.js
 */

var http = require('http'),
    //This regexp is not bullet-proof, and it has one optional part to
    //avoid issues with some Dojo transition modules that use a
    //define(\n//begin v1.x content
    //for a comment.
    anonDefRegExp = /(require\s*\.\s*def|define)\s*\(\s*(\/\/[^\n\r]*[\r\n])?(\[|f|\{)/;

function getAnonDeps(contents) {
    //The regexp approach could be replaced with an uglifyjs parse and AST traversal.
    //Regexp for finding require('') calls.
    var depRegExp = /require\s*\(\s*["']([^"']+)["']\s*\)/g,
        deps = [],
        match, depName;

    //Remove comments first
    contents = contents.replace(/(\/\*([\s\S]*?)\*\/|\/\/(.*)$)/mg, "");

    depRegExp.lastIndex = 0;
    //Find dependencies in the code that was not in comments.
    while ((match = depRegExp.exec(contents))) {
        depName = match[1];
        if (depName) {
            deps.push('"' + depName + '"');
        }
    }

    if (deps.length) {
        deps = ['require', 'exports', 'module'].concat(deps);
    }

    return deps;
}

//Function to convert an anonymous module to a named module, and with CommonJS
//require('') dependencies parsed out.
function toTransport(moduleName, contents) {
    //If anonymous module, insert the module name.
    return contents.replace(anonDefRegExp, function (match, callName, possibleComment, suffix) {

        //Look for CommonJS require calls inside the function if this is
        //an anonymous define/require.def call that just has a function registered.
        var deps = null;
        if (suffix.indexOf('f') !== -1) {
            deps = getAnonDeps(contents);

            if (deps.length) {
                deps = deps.map(function (dep) {
                    return "'" + dep + "'";
                });
            } else {
                deps = null;
            }
        }

        return "define('" + moduleName + "'," +
               (deps ? ('[' + deps.toString() + '],') : '') +
               suffix;
    });
}

//Start up the server
http.createServer(function (req, res) {
    var fs = require('fs'),
        parts = req.url.split('?')[1].split('^'),
        result = '',
        name, url, contents;

debugger;
    parts.forEach(function (part) {
        part = part.split('@');
        name = part[0];
        url = part[1];

        contents = fs.readFileSync(url, 'utf8');

        result += toTransport(name, contents);
    });


    res.writeHead(200, {'Content-Type': 'application/javascript'});
    res.end(result);
}).listen(8123, "127.0.0.1");
