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
    require.depsNamesByName[fullName] = deps.slice(0);
    require.urlByFullName[fullName] = url;
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
    if(exc.module) {
      var errantModule = exc.module;
      var dependents = [];
      Object.keys(require.depsNamesByName).forEach(function(fullName) {
        var depsNames = require.depsNamesByName[fullName];
        if (depsNames.indexOf(errantModule) !== -1) {
          dependents.push(fullName);
        }
      });
      exc.dependents = dependents;
    }
    var stack = exc.stack;  // Web Inspector does not show stack 
    if (stack) exc._stack = stack.split('\n');
    console.error(exc.toString(), exc);
};

require({waitSeconds: 10});  // disable the timeout