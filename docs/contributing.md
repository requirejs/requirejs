# Contributing to RequireJS

[The source for RequireJS is available on GitHub](http://github.com/jrburke/requirejs).

To contribute to the project:

For something that is bigger than a one or two line fix:

* [Create your own fork of the code](http://help.github.com/forking/)
* Do the changes in your fork
* If you like the change and think the project could use it:
    * Be sure you have followed [the code style for the project](#codestyle).
    * Sign a [Contributor License Agreement, CLA, with the Dojo Foundation](http://www.dojofoundation.org/about/cla/) and send it to them.
    * Send a pull request indicating that you have a CLA on file.

For one or two line fixes, you can use the [RequireJS GitHub Issues page](http://github.com/jrburke/requirejs/issues) to indicate the problem. You can also do the full fork/pull request as mentioned above, but a CLA is not needed for one or two line fixes.

For discussions on code changes/additions/requests use the [RequireJS Group](http://groups.google.com/group/requirejs).

## <a name="#whycla">Why a CLA?</a>

CLAs are common with open source projects, with the Apache projects probably being the most well known. The goal is to allow RequireJS to be used in as many projects as possible, and for some companies, using only CLA-approved code is the best option.

You still own the copyright on your contribution, the CLA just gives the most flexibility for licensing, and assures the lineage of the intellectual property. You should only submit patches for your own intellectual property, and not the intellectual property of others.

Additional reading that may be helpful:

* [Wikipedia on CLAs](http://en.wikipedia.org/wiki/Contributor_License_Agreement)

## <a name="codestyle">Code Style</a>

[JSLint](http://jslint.com/) is used for checking code style. It is also useful for avoiding some errors. The default settings on JSLint should be fine to use, in particular, 4 spaces for indentation, do not use tabs.

camelCase should be used for all variables and file names. Avoid the use of underscores as word separators. This extends to things like CSS class names, IDs in test HTML documents, everything.

Some exceptions to JSLint can be indicated at the top of each JS file, but they should be avoided when possible. Two common exceptions you may see in the source:

* **nomen: false**, allow underscore at the beginning of some property/variable/function names.
* **plusplus: false**, but only to allow for loops with an incrementing ++ value. Other uses of ++ should be avoided.

It is possible a patch or pull request will be rejected if it does not follow the code style.
