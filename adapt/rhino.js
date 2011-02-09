/**
 * @license RequireJS rhino Copyright (c) 2010-2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*jslint strict: false */
/*global require: false, java: false, load: false */

(function () {

    require.load = function (context, moduleName, url) {
        //isDone is used by require.ready()
        require.s.isDone = false;

        //Indicate a the module is in process of loading.
        context.loaded[moduleName] = false;
        context.scriptCount += 1;

        load(url);

        //Support anonymous modules.
        context.completeLoad(moduleName);
    };

    //Adapter to get text plugin to work.
    require.fetchText = function (url, callback) {
        var encoding = "utf-8",
            file = new java.io.File(url),
            lineSeparator = java.lang.System.getProperty("line.separator"),
            input = new java.io.BufferedReader(new java.io.InputStreamReader(new java.io.FileInputStream(file), encoding)),
            stringBuffer, line,
            content = '';
        try {
            stringBuffer = new java.lang.StringBuffer();
            line = input.readLine();

            // Byte Order Mark (BOM) - The Unicode Standard, version 3.0, page 324
            // http://www.unicode.org/faq/utf_bom.html

            // Note that when we use utf-8, the BOM should appear as "EF BB BF", but it doesn't due to this bug in the JDK:
            // http://bugs.sun.com/bugdatabase/view_bug.do?bug_id=4508058
            if (line && line.length() && line.charAt(0) === 0xfeff) {
                // Eat the BOM, since we've already found the encoding on this file,
                // and we plan to concatenating this buffer with others; the BOM should
                // only appear at the top of a file.
                line = line.substring(1);
            }

            stringBuffer.append(line);

            while ((line = input.readLine()) !== null) {
                stringBuffer.append(lineSeparator);
                stringBuffer.append(line);
            }
            //Make sure we return a JavaScript string and not a Java string.
            content = String(stringBuffer.toString()); //String
        } finally {
            input.close();
        }
        callback(content);
    };

}());