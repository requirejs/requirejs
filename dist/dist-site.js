/**
 * @license RequireJS Copyright (c) 2010, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*
This file assumes Java 1.6 or greater is installed:

> java -jar ../build/lib/rhino/js.jar dist-site.js

debugging:

> java -classpath ../build/lib/rhino/js.jar org.mozilla.javascript.tools.debugger.Main dist-site.js

*/

/*jslint regexp: false, nomen: false, plusplus: false */
/*global load: false, print: false, quit: false, logger: false,
  fileUtil: false, java: false, Packages: false, readFile: false */

"use strict";

load("../build/jslib/logger.js");
load("../build/jslib/fileUtil.js");

var files, i, mdFile, htmlFile, fileContents,
    runtime = Packages.java.lang.Runtime.getRuntime(),
    process, preContents, postContents, h1, homePath, cssPath, length, j, isTopPage = false;

//Copy all the text files to a dist directory
fileUtil.deleteFile("./dist-site/");
fileUtil.copyFile("main.css", "./dist-site/main.css");
fileUtil.copyDir("fonts", "./dist-site/fonts", /\w/);
fileUtil.copyFile("../README.md", "./dist-site/index.md");
fileUtil.copyDir("../docs/", "./dist-site/docs/", /\w/);

preContents = fileUtil.readFile("pre.html");
postContents = fileUtil.readFile("post.html");

//Convert each .md file to an HTML file
files = fileUtil.getFilteredFileList("./dist-site", /\.md$/, true);
for (i = 0; (mdFile = files[i]); i++) {
    htmlFile = mdFile.replace(/\.md$/, ".html");

    logger.trace("Creating " + htmlFile);

    //Do Markdown
    process = runtime.exec(["/bin/sh", "-c", "./Markdown.pl --html4tags " + mdFile + " > " + htmlFile]);
    process.waitFor();

    //Build up a complete HTML file.
    fileContents = fileUtil.readFile(htmlFile);
    fileContents = preContents + fileContents + postContents;

    //Set the title of the HTML page
    h1 = fileContents.match(/<h1>([^<]+)<\/h1>/);
    if (h1 && h1[1]) {
        h1 = h1[1];
    } else {
        h1 = "";
    }

    fileContents = fileContents.replace(/\$\{title\}/, h1);

    //Change any .md references to .html references, and remove tree/master
    //links
    fileContents = fileContents.replace(/href="requirejs\/tree\/master\/docs\//g, 'href="docs/').replace(/href="([^"]+)\.md/g, 'href="$1.html');

    //Adjust the path the home and main.css
    homePath = htmlFile.replace(/\/[^\/]+$/, "").replace(/^\.\/dist-site\//, "");
    if (!homePath || homePath === "./dist-site") {
        isTopPage = true;
        homePath = "./";
        cssPath = "main.css";
    } else {
        isTopPage = false;
        length = homePath.split("/").length;
        homePath = "";
        for (j = 0; j < length; j++) {
            homePath += "../";
        }
        cssPath = homePath + "main.css";
    }
    fileContents = fileContents.replace(/HOMEPATH/, homePath);
    fileContents = fileContents.replace(/\main\.css/, cssPath);


    //If it is the top page, adjust the header links
    if (isTopPage) {
        fileContents = fileContents
                       .replace(/href="\.\.\/"/g, 'href="./"')
                       .replace(/class="local" href="([^"]+)"/g, 'class="local" href="docs/$1"');
    }

    fileUtil.saveFile(htmlFile, fileContents);

    //Remove the .md file
    fileUtil.deleteFile(mdFile);
}
