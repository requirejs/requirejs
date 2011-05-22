function runTest()
{
    FBTest.sysout("dependencies.START;");
    FBTest.progress("using module dependencies baseLocalPath " + baseLocalPath);

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
        FBTest.sysout("baseURLIsNull ERROR "+exc);
    }
    finally
    {
        FBTest.compare("No baseUrl, needed for URL: baseURLIsNull.js", onErrorMessage, "Test Null baseUrl message");
    }


    delete config.baseUrl;
    if (baseLocalPath)
        config.baseUrl = baseLocalPath + "loader/diagnostics/";

    // ----------------------------------------------------------------------------------------------------
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
        FBTest.sysout("syntaxErrorInsideDefine ERROR "+exc);
    }
    finally
    {
        FBTest.compare("No baseUrl, needed for URL: baseURLIsNull.js", onErrorMessage, "Test syntax error in define()");
    }
}
