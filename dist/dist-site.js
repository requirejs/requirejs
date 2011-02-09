/**
 * @license RequireJS Copyright (c) 2010-2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*
To run this file, use x (assumes Node installed):

> ../bin/x dist-site.js

*/

/*jslint regexp: false, nomen: false, plusplus: false, strict: false */
/*global require: false */

require(['logger', 'env!env/file', 'child_process'], function (logger, file, child_process) {

    var files, htmlFile, transFile, fileContents,
        preContents, postContents, h1, homePath, cssPath,
        ieCssPath, jsPath, length, j,
        isTopPage = false,
        fileIndex = 0;

    //Copy all the text files to a dist directory
    //file.deleteFile("./dist-site/");
    file.copyFile("main.css", "./dist-site/main.css");
    file.copyFile("ie.css", "./dist-site/ie.css");
    file.copyFile("init.js", "./dist-site/init.js");
    file.copyDir("fonts", "./dist-site/fonts", /\w/);
    file.copyFile("../index.html", "./dist-site/index.html");
    file.copyDir("../docs/", "./dist-site/docs/", /\w/);

    preContents = file.readFile("pre.html");
    postContents = file.readFile("post.html");

    //Convert each .html file to a full HTML file
    files = file.getFilteredFileList("./dist-site", /\.html$/, true);

    function processFile() {
        htmlFile = files[fileIndex];
        fileIndex += 1;
        if (!htmlFile) {
            //Done processing files.
            return;
        }

        transFile = htmlFile + '.trans';

        logger.trace("Creating " + htmlFile);

        //Do Markdown
        child_process.exec(
            "./Markdown.pl --html4tags " + htmlFile + " > " + transFile,
            function (error, stdout, stderr) {
                if (error) {
                    logger.error('Could not markdown ' + htmlFile);
                    processFile();
                    return;
                }

                //Build up a complete HTML file.
                fileContents = file.readFile(transFile);
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
                fileContents = fileContents
                               .replace(/href="requirejs\/tree\/master\/docs\//g, 'href="docs/')
                               .replace(/href="([^"]+)\.md/g, 'href="$1.html');

                //Adjust the path the home and main.css
                homePath = htmlFile.replace(/\/[^\/]+$/, "").replace(/^\.\/dist-site\//, "");
                if (!homePath || homePath === "dist-site") {
                    isTopPage = true;
                    homePath = "./";
                    cssPath = "main.css";
                    ieCssPath = "ie.css";
                    jsPath = "init.js";
                } else {
                    isTopPage = false;
                    length = homePath.split("/").length;
                    homePath = "";
                    for (j = 0; j < length - 1; j++) {
                        homePath += "../";
                    }
                    cssPath = homePath + "main.css";
                    ieCssPath = homePath + "ie.css";
                    jsPath = homePath + "init.js";
                }
                fileContents = fileContents.replace(/HOMEPATH/g, homePath);
                fileContents = fileContents.replace(/\main\.css/, cssPath);
                fileContents = fileContents.replace(/\ie\.css/, ieCssPath);
                fileContents = fileContents.replace(/\init\.js/, jsPath);


                //If it is the top page, adjust the header links
                if (isTopPage) {
                    fileContents = fileContents
                                   .replace(/href="\.\.\/"/g, 'href="./"')
                                   .replace(/class="local" href="([^"]+)"/g, 'class="local" href="docs/$1"');
                }

                file.saveFile(htmlFile, fileContents);

                file.deleteFile(transFile);

                processFile();
            }
        );
    }

    processFile();
});
