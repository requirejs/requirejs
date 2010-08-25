# pkg.js

This is a package manager for projects that user RequireJS. It knows how to update the paths for your project so it can effectively load modules from packages. pkg.js can also download packages from remote locations so that they load locally, and can be used as part of the RequireJS optimization tool.

It can use packages that have its modules written in the CommonJS module format. For those modules it will download the package to your project and convert the modules to RequireJS syntax.

## What are packages?

TODO: explain

## Usage

### Prerequisites

Need Node or Java 1.5 or later installed.

TODO: explain how to use it.

Projects conform to this layout:
xxxx

* pkg.js createApp appName
    * Generates dir structure, stub an application-level package.json file.
    * puts in require.js and r.js (the RequireJS/Node adapter) too.
* pkg.js add packageName version (or an URL)
    * pkg.js adds the package dependency info to app's package.json
    * fetches the dependency and any of its dependencies.
* pkg.js create packageName : creates a new package that is subject to version control.
    * Different from createApp in that it is assumed not to have require.js included, and it will not need to update config objects in the top-level app modules.
* pkg.js update : updates the app config to be the latest based on sub packages.
* pkg.js addApp name: adds a new entry to package.json's app property, updates
  that named module to have the automated require() config injection. Used to specify
  what top-level app modules are used in the webapp. App modules are the top level
  module that is loaded by a particular web page.



## What does pkg.js do?

TODO: explain the steps that pkg.js does under the covers.