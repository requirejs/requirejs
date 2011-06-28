/*Software License Agreement (BSD License)

Copyright (c) 2007, Parakey Inc.
All rights reserved.

Redistribution and use of this software in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above
  copyright notice, this list of conditions and the
  following disclaimer.

* Redistributions in binary form must reproduce the above
  copyright notice, this list of conditions and the
  following disclaimer in the documentation and/or other
  materials provided with the distribution.

* Neither the name of Parakey Inc. nor the names of its
  contributors may be used to endorse or promote products
  derived from this software without specific prior
  written permission of Parakey Inc.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR
IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR
CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER
IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*/
// johnjbarton@johnjbarton.com May 2011 IBM Corp.

// Extend require.js to add debugging information
// Include this file immediately after require.js
// ********************************************************************************************* //

/*
 * Override this function to write output from the debug support for require.
 * @param see Firebug console.log
 */
require.log = function()
{
    if (window.console)
        console.log.apply(console, arguments);
    else
    {
        try
        {
            FBTrace.sysout.apply(FBTrace, arguments);
        }
        catch(exc)
        {
            alert.apply(null, arguments);
        }
    }

}

/*
 * Called by require for each completed module
 * @param fullName module name
 * @param deps array of module names that fullName depends upon
 */
require.onDebugDAG = function(fullName, deps, url)
{
    if (!require.depsNamesByName)
    {
        require.depsNamesByName = {};
        require.urlByFullName = {};
    }


    var arr = [];
    for (var p in deps)
        arr.push(p);
    require.depsNamesByName[fullName] = arr;
    require.urlByFullName[fullName] = url;
}

/* Calls require.log to record dependency analysis.
 * Call this function from your main require.js callback function
 * @param none
 *
 */
require.analyzeDependencyTree = function()
{
    require.log("Firebug module list: ", require.depsNamesByName);

    // For each deps item create an object referencing dependencies
    function linkArrayItems(id, depNamesByName, path)
    {
        var deps = depNamesByName[id];
        var result = {};
        for (var i = 0; i < deps.length; i++)
        {
            var depID = deps[i];
            if (path.indexOf(":" + depID + ":") == -1) // Then depId is not already an dependent
                result[depID] = linkArrayItems(depID, depNamesByName, path + ":" + depID + ":");
            else
                require.log("Circular dependency: " + path + ":" + depID + ":");
        }
        return result;
    }

    var linkedDependencies = {};
    var dependents = {}; // reversed list, dependents by name
    var depNamesByName = require.depsNamesByName;
    for (var name in depNamesByName)
    {
        var depArray = depNamesByName[name];

        if (name === "undefined") {
            linkedDependencies["__main__"] = linkArrayItems(name, depNamesByName, "");
            name = "__main__";
        }
        for (var i = 0; i < depArray.length; i++)
        {
            var dependent = depArray[i];
            if (!dependents[dependent])
                dependents[dependent] = [];
            dependents[dependent].push(name);
        }
    }
    var minimal = [];
    var mainDeps = depNamesByName["undefined"];
    for (var i = 0; i < mainDeps.length; i++)
    {
        var dependencyOfMain = mainDeps[i];
        var dependentsOfDependencyOfMain = dependents[dependencyOfMain];
        if (dependentsOfDependencyOfMain.length === 1)
            minimal.push(dependencyOfMain);
    }

    require.log("Firebug module dependency tree: ", linkedDependencies);
    require.log("Firebug dependents: ", dependents);
    require.log("Firebug minimal modules list: ", minimal);
    require.log("Firebug URLs: ", require.urlByFullName);
}

/*
 * Calls require.log for warning and debug of require.js.
 * Called by require.js diagnostic branch
 */
require.onDebug = function()
{
    try
    {
        require.log.apply(null,arguments);
    }
    catch(exc)
    {
        var msg = "";
        for (var i = 0; i < arguments.length; i++)
            msg += arguments[i]+", ";
        window.alert("Loader; onDebug:"+msg+"\n");
    }
}

/*
 * Calls require.log for errors, then throws exception
 * Called by require.js
 */
require.onError = function(exc)
{
    require.onDebug.apply(require, arguments);
    throw exc;
}