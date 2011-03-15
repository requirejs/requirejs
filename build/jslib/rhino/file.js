/**
 * @license RequireJS Copyright (c) 2010-2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */
//Helper functions to deal with file I/O.

/*jslint plusplus: false, strict: false */
/*global java: false, define: false */

define(function () {
    var file = {
        backSlashRegExp: /\\/g,

        getLineSeparator: function () {
            return file.lineSeparator;
        },

        lineSeparator: java.lang.System.getProperty("line.separator"), //Java String

        exists: function (fileName) {
            return (new java.io.File(fileName)).exists();
        },

        parent: function (fileName) {
            return file.absPath((new java.io.File(fileName)).getParentFile());
        },

        normalize: function (fileName) {
            return file.absPath(fileName);
        },

        isFile: function (path) {
            return (new java.io.File(path)).isFile();
        },

        isDirectory: function (path) {
            return (new java.io.File(path)).isDirectory();
        },

        /**
         * Gets the absolute file path as a string, normalized
         * to using front slashes for path separators.
         * @param {java.io.File||String} file
         */
        absPath: function (fileObj) {
            if (typeof fileObj === "string") {
                fileObj = new java.io.File(fileObj);
            }
            return (fileObj.getAbsolutePath() + "").replace(file.backSlashRegExp, "/");
        },

        getFilteredFileList: function (/*String*/startDir, /*RegExp*/regExpFilters, /*boolean?*/makeUnixPaths, /*boolean?*/startDirIsJavaObject) {
            //summary: Recurses startDir and finds matches to the files that match regExpFilters.include
            //and do not match regExpFilters.exclude. Or just one regexp can be passed in for regExpFilters,
            //and it will be treated as the "include" case.
            //Ignores files/directories that start with a period (.).
            var files = [], topDir, regExpInclude, regExpExclude, dirFileArray,
                i, fileObj, filePath, ok, dirFiles;

            topDir = startDir;
            if (!startDirIsJavaObject) {
                topDir = new java.io.File(startDir);
            }

            regExpInclude = regExpFilters.include || regExpFilters;
            regExpExclude = regExpFilters.exclude || null;

            if (topDir.exists()) {
                dirFileArray = topDir.listFiles();
                for (i = 0; i < dirFileArray.length; i++) {
                    fileObj = dirFileArray[i];
                    if (fileObj.isFile()) {
                        filePath = fileObj.getPath();
                        if (makeUnixPaths) {
                            //Make sure we have a JS string.
                            filePath = String(filePath);
                            if (filePath.indexOf("/") === -1) {
                                filePath = filePath.replace(/\\/g, "/");
                            }
                        }

                        ok = true;
                        if (regExpInclude) {
                            ok = filePath.match(regExpInclude);
                        }
                        if (ok && regExpExclude) {
                            ok = !filePath.match(regExpExclude);
                        }

                        if (ok && !fileObj.getName().match(/^\./)) {
                            files.push(filePath);
                        }
                    } else if (fileObj.isDirectory() && !fileObj.getName().match(/^\./)) {
                        dirFiles = this.getFilteredFileList(fileObj, regExpFilters, makeUnixPaths, true);
                        files.push.apply(files, dirFiles);
                    }
                }
            }

            return files; //Array
        },

        copyDir: function (/*String*/srcDir, /*String*/destDir, /*RegExp?*/regExpFilter, /*boolean?*/onlyCopyNew) {
            //summary: copies files from srcDir to destDir using the regExpFilter to determine if the
            //file should be copied. Returns a list file name strings of the destinations that were copied.
            regExpFilter = regExpFilter || /\w/;

            var fileNames = file.getFilteredFileList(srcDir, regExpFilter, true),
            copiedFiles = [], i, srcFileName, destFileName;

            for (i = 0; i < fileNames.length; i++) {
                srcFileName = fileNames[i];
                destFileName = srcFileName.replace(srcDir, destDir);

                if (file.copyFile(srcFileName, destFileName, onlyCopyNew)) {
                    copiedFiles.push(destFileName);
                }
            }

            return copiedFiles.length ? copiedFiles : null; //Array or null
        },

        copyFile: function (/*String*/srcFileName, /*String*/destFileName, /*boolean?*/onlyCopyNew) {
            //summary: copies srcFileName to destFileName. If onlyCopyNew is set, it only copies the file if
            //srcFileName is newer than destFileName. Returns a boolean indicating if the copy occurred.
            var destFile = new java.io.File(destFileName), srcFile, parentDir,
            srcChannel, destChannel;

            //logger.trace("Src filename: " + srcFileName);
            //logger.trace("Dest filename: " + destFileName);

            //If onlyCopyNew is true, then compare dates and only copy if the src is newer
            //than dest.
            if (onlyCopyNew) {
                srcFile = new java.io.File(srcFileName);
                if (destFile.exists() && destFile.lastModified() >= srcFile.lastModified()) {
                    return false; //Boolean
                }
            }

            //Make sure destination dir exists.
            parentDir = destFile.getParentFile();
            if (!parentDir.exists()) {
                if (!parentDir.mkdirs()) {
                    throw "Could not create directory: " + parentDir.getAbsolutePath();
                }
            }

            //Java's version of copy file.
            srcChannel = new java.io.FileInputStream(srcFileName).getChannel();
            destChannel = new java.io.FileOutputStream(destFileName).getChannel();
            destChannel.transferFrom(srcChannel, 0, srcChannel.size());
            srcChannel.close();
            destChannel.close();

            return true; //Boolean
        },

        readFile: function (/*String*/path, /*String?*/encoding) {
            //A file read function that can deal with BOMs
            encoding = encoding || "utf-8";
            var fileObj = new java.io.File(path),
                    input = new java.io.BufferedReader(new java.io.InputStreamReader(new java.io.FileInputStream(fileObj), encoding)),
                    stringBuffer, line;
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
                while (line !== null) {
                    stringBuffer.append(line);
                    stringBuffer.append(file.lineSeparator);
                    line = input.readLine();
                }
                //Make sure we return a JavaScript string and not a Java string.
                return String(stringBuffer.toString()); //String
            } finally {
                input.close();
            }
        },

        saveUtf8File: function (/*String*/fileName, /*String*/fileContents) {
            //summary: saves a file using UTF-8 encoding.
            file.saveFile(fileName, fileContents, "utf-8");
        },

        saveFile: function (/*String*/fileName, /*String*/fileContents, /*String?*/encoding) {
            //summary: saves a file.
            var outFile = new java.io.File(fileName), outWriter, parentDir, os;

            parentDir = outFile.getAbsoluteFile().getParentFile();
            if (!parentDir.exists()) {
                if (!parentDir.mkdirs()) {
                    throw "Could not create directory: " + parentDir.getAbsolutePath();
                }
            }

            if (encoding) {
                outWriter = new java.io.OutputStreamWriter(new java.io.FileOutputStream(outFile), encoding);
            } else {
                outWriter = new java.io.OutputStreamWriter(new java.io.FileOutputStream(outFile));
            }

            os = new java.io.BufferedWriter(outWriter);
            try {
                os.write(fileContents);
            } finally {
                os.close();
            }
        },

        deleteFile: function (/*String*/fileName) {
            //summary: deletes a file or directory if it exists.
            var fileObj = new java.io.File(fileName), files, i;
            if (fileObj.exists()) {
                if (fileObj.isDirectory()) {
                    files = fileObj.listFiles();
                    for (i = 0; i < files.length; i++) {
                        this.deleteFile(files[i]);
                    }
                }
                fileObj["delete"]();
            }
        }
    };

    return file;
});
