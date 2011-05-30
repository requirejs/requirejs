function exceptionToString(exc)
{
    return exc.toString() +" "+(exc.fileName || exc.sourceName) + "@" + exc.lineNumber;
}

var testQueue = [];
function runNextTest() {
    if (testQueue.length)
    {
        var test = testQueue.shift();
        if (test)
            test.call();
    }
    else
    {
        FBTest.sysout("DONE");
    }
}

function runTest()
{
    FBTest.progress("diagnotics test start, using baseLocalPath " + baseLocalPath);

    // ----------------------------------------------------------------------------------------------------
    testQueue.push(testNullBaseURL);
    // ----------------------------------------------------------------------------------------------------
    testQueue.push(testBadBaseURL);
    // ----------------------------------------------------------------------------------------------------
    testQueue.push(testSyntaxError);
    // ----------------------------------------------------------------------------------------------------
    testQueue.push(testRuntimeError);
    // ----------------------------------------------------------------------------------------------------
    testQueue.push(testNotLoaded);
    // ----------------------------------------------------------------------------------------------------
    testQueue.push(testDefineWithNoReturn);
    // ----------------------------------------------------------------------------------------------------
    testQueue.push(testTwoDefineOneFile);

    runNextTest();
}

function getTestConfig() {

    var config = {
            context: "testRequireJS" + Math.random(),  // to give each test its own loader,

            onDebug: function(msg)
            {
                FBTest.progress("onDebug: " + msg);
            },
            onError: function(msg)
            {
                FBTest.progress("onError: " + msg);
                throw msg;
            },
            onTrace: function(msg)
            {
               // FBTest.progress("onTrace:" + msg);
            },
            debug: true,
        };

    if (baseLocalPath)
    {
        config.baseUrl = baseLocalPath + "/requirejs/tests/diagnostics/";
    }

    return config;
}

function testNullBaseURL()
{
    FBTest.progress("----------------------------------- Null baseURL test");

    var config = getTestConfig();
    config.baseUrl =  null;

    var require = FBTest.getRequire();

    var onErrorMessage = "";

    require.onError = function(msg) {
        FBTest.sysout("require.onError "+msg);
        onErrorMessage = ""+msg;
        throw msg;
    }

    try
    {
        require(config, ["baseURLIsNull"], function(baseURLIsNull)
                {
                    FBTest.progress("AMD callback baseURLIsNull");
                });
    }
    catch(exc)
    {
        FBTest.sysout("catch block: baseURLIsNull ERROR "+exceptionToString(exc) );
    }
    finally
    {
        FBTest.compare("No baseUrl, needed for URL: baseURLIsNull.js", onErrorMessage, "Test Null baseUrl message");
        runNextTest();
    }
}

function testBadBaseURL() {
    FBTest.progress("----------------------------------- Bad baseURL test");

    var config = getTestConfig();

    var badBase = "NoEndingSlash";
    config.baseUrl = badBase + "loader/diagnostics/";

    var onErrorMessage = "";

    var require = FBTest.getRequire();
    require.onError = function(msg) {
        FBTest.sysout("require.onError "+msg);
        var expected = "Error: Could not resolve "+
        "http://localhost:8080/file/i/tests/content/branches/1.8/loader/diagnostics/NoEndingSlashloader/diagnostics/badBaseURL.js\n"+
        "http://requirejs.org/docs/errors.html#network";
        FBTest.compare(expected, msg.toString(), "Test Null baseUrl message");
        setTimeout(runNextTest);
        throw msg;
    }

    try
    {
        require(config, ["badBaseURL"], function(Bad)
        {
            FBTest.sysout("AMD callback: badBaseURL complete");
        });
    }
    catch(exc)
    {
        FBTest.sysout("catch block, badBaseURL exception: "+exceptionToString(exc) );
    }
    return;
}

function testSyntaxError() {
    FBTest.progress("----------------------------------- Syntax Error test");

    var config = getTestConfig();
    if (baseLocalPath)
    {
        config.baseUrl = baseLocalPath + "/requirejs/tests/diagnostics/";
    }
    config.context = "testRequireJS" + Math.random(); // to give each test its own loader,

    var require = FBTest.getRequire();

    require.onDebug = function(msg) {
        FBTest.sysout("require.onError "+msg);
        var expected = "Error: Undefined dependency syntaxErrorInsideDefine\n"+
            "http://requirejs.org/docs/errors.html#undefinedDependency";
        var actual = ""+msg;
        FBTest.compare(expected, actual, "Test syntax error in define()");
        setTimeout(runNextTest);
        throw msg;
    }

    try
    {
        require(config, ["syntaxErrorInsideDefine"], function(syntaxError)
        {
            FBTest.progress("AMD callback: syntaxErrorTest");
            FBTest.compare("called onError","called AMD callback",  "Test syntax error in define() should not call the AMD callback");
            setTimeout(runNextTest);
        });
    }
    catch(exc)
    {
        FBTest.sysout("catch block: syntaxErrorInsideDefine ERROR "+exceptionToString(exc) );
    }
}

function testRuntimeError() {
    FBTest.progress("----------------------------------- Runtime error during define test");

    var config = getTestConfig();

    var require = FBTest.getRequire();

    require.onError = function(msg) {
        FBTest.sysout("require.onError "+msg, msg);
        var expected = "ReferenceError: noSuchFunction is not defined";
        var actual = ""+msg;
        FBTest.compare(expected, actual, "Test runtime error in define()");
        setTimeout(runNextTest);
        throw msg;
    }
    try
    {
        require(config, ["runtimeErrorInsideDefine"], function(syntaxError)
        {
            FBTest.progress("AMD callback: runtimeErrorInsideDefine callback")
        });
    }
    catch(exc)
    {
        FBTest.sysout("catch block: runtimeErrorInsideDefine ERROR "+exceptionToString(exc) );
    }
}

function testNotLoaded() {
    FBTest.progress("----------------------------------- require module not loaded");

    var config = getTestConfig();

    var require = FBTest.getRequire();
    require.onError = function(msg) {
        FBTest.sysout("require.onError "+msg);
        var expected = "Error: Module name 'not/loaded' has not been loaded yet for context: _\nhttp://requirejs.org/docs/errors.html#notloaded";
        FBTest.compare(expected, msg+"", "Test require module not loaded");
        setTimeout(runNextTest);
        throw msg;
    }

    try
    {
        require(config);
        require("not/loaded");
    }
    catch(exc)
    {
        FBTest.sysout("catch block testNotLoaded: exception "+exceptionToString(exc) );
    }
}

function testDefineWithNoReturn() {
    FBTest.progress("----------------------------------- define() with no return");

    var config = getTestConfig();

    var require = FBTest.getRequire();
    require.onDebug = function(msg) {
        FBTest.sysout("require.onError "+msg);
        var expected = "Error: The module 'defineWithNoReturn' has false return value\n"+
            "http://requirejs.org/docs/errors.html#noreturn";
        FBTest.compare(expected, msg+"", "Test define() with no return");
        setTimeout(runNextTest);
        throw msg;
    }

    try
    {
        require(config, ["defineWithNoReturn"], function (defineWithNoReturn)
        {
            FBTest.sysout("AMD callback for defineWithNoReturn = "+defineWithNoReturn);
            var goodStuff = defineWithNoReturn.goodStuff;
        });
    }
    catch(exc)
    {
        FBTest.sysout("catch block defineWithNoReturn: exception "+exceptionToString(exc) );
    }

}

function testTwoDefineOneFile() {
    FBTest.progress("----------------------------------- Two anonymous define() in one file");

    var config = getTestConfig();

    var require = FBTest.getRequire();
    require.onError = function(msg) {
        FBTest.sysout("require.onError "+msg);
        var expected = "Error: Second anonymous define(): function (A) {\n    var C = {};\n    return C;\n}\nhttp://requirejs.org/docs/errors.html#mismatch";
        FBTest.compare(expected, msg+"", "Test Two anonymous define() in one file");
        setTimeout(runNextTest);
        throw msg;
    }

    try
    {
        require(config, ["twoDefineOneFile"], function (twoDefineOneFile)
        {
            FBTest.sysout("AMD callback for twoDefineOneFile = "+twoDefineOneFile);
            var goodStuff = twoDefineOneFile.goodStuff;
        });
    }
    catch(exc)
    {
        FBTest.sysout("catch block twoDefineOneFile: exception "+exceptionToString(exc) );
    }

}