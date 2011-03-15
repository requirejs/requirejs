# RequireJS dist

This directory contains the tools that are used to build distributions of RequireJS and its web site.

When doing a release, do the following:

* Update files to the new version number:
    * require.js, both places
    * all plugins, both places
    * README.md
    * docs/download.md: check for nested paths too, add new release section
    * pre.html
    * post.html
* Commit/push changes

* Tag the tree:
    * git tag -am "Release 0.0.0" 0.0.0
    * git push --tags

Now pull down the tagged version to do a distribution:

* git clone git://github.com/jrburke/requirejs.git requirejs-dist
* cd requirejs-dist
* git checkout 0.0.0
* cd dist

Run the distribution tasks.

To generate the web site:

* java -jar ../build/lib/rhino/js.jar dist-site.js

To generate a build

* ./dist-build.sh 0.0.0

When done, reset versions to:

* 0.0.0+ in require.js
* X.X.X in pre.html
