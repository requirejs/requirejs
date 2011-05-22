function exceptionToString(exc)
{
    return exc.toString() +" "+(exc.fileName || exc.sourceName) + "@" + exc.lineNumber;
}
function runTest()
{
    FBTest.progress("diagnotics test start, using baseLocalPath " + baseLocalPath);

    // ----------------------------------------------------------------------------------------------------
    FBTest.progress("Null baseURL test");

    var config = {
        context: "testRequireJS" + Math.random(),  // to give each test its own loader,
        baseUrl: null,  // << For first test
        onDebug: function(msg)
        {
            FBTest.progress("onDebug: " + msg);
        },
        onError: function(msg)
        {
            FBTest.progress("onError: " + msg);
        },
        onTrace: function(msg)
        {
            //FBTest.sysout("onTrace:" + msg);
        },
        debug: true,
    };

    var require = FBTest.getRequire();

    var onErrorMessage = "";
    require.onError = function(msg) {
        onErrorMessage = msg;
    }

    try
    {
        require(config, ["baseURLIsNull"], function(baseURLIsNull)
                {
                    // We never get here.
                });
    }
    catch(exc)
    {
        FBTest.sysout("baseURLIsNull ERROR "+exceptionToString(exc) );
    }
    finally
    {
        FBTest.compare("No baseUrl, needed for URL: baseURLIsNull.js", onErrorMessage, "Test Null baseUrl message");
    }


    delete config.baseUrl;

    // ----------------------------------------------------------------------------------------------------
    FBTest.progress("Bad baseURL test");

    var badBase = "NoEndingSlash";
    config.baseUrl = badBase + "loader/diagnostics/";

    onErrorMessage = null;
    require.onError = function(msg) {
        onErrorMessage = msg;
    }

    try
    {
        require(config, ["badBaseURL"], function(Bad)
        {
            // never get here
        });
    }
    catch(exc)
    {
        FBTest.sysout("baseBaseURL ERROR "+exceptionToString(exc) );
    }
    finally
    {
        FBTest.compare("Bad baseUrl, needed for URL: baseURLIsNull.js", onErrorMessage, "Test syntax error in define()");
    }


    // ----------------------------------------------------------------------------------------------------
    FBTest.progress("Syntax Error test");


    if (baseLocalPath)
    {
        config.baseUrl = baseLocalPath + "/loader/diagnostics/";
    }

    onErrorMessage = null;
    require.onError = function(msg) {
        onErrorMessage = msg;
    }

    try
    {
        require(config, ["syntaxErrorInsideDefine"], function(syntaxError)
        {
            var message = A.getMessage();
            FBTest.compare("Hello World!", message, "The message from modules must match.");
            FBTest.testDone("dependencies.DONE");
        });
    }
    catch(exc)
    {
        FBTest.sysout("syntaxErrorInsideDefine ERROR "+exceptionToString(exc) );
    }
    finally
    {
        FBTest.compare("No baseUrl, needed for URL: baseURLIsNull.js", onErrorMessage, "Test syntax error in define()");
    }
}
