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
            throw msg;
        },
        onTrace: function(msg)
        {
           // FBTest.progress("onTrace:" + msg);
        },
        debug: true,
    };

    var require = FBTest.getRequire();

    var onErrorMessage = "";
    require.onError = function(msg) {
        onErrorMessage = ""+msg;
        throw msg;
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

    try
    {
        require(config, ["badBaseURL"], function(Bad)
        {
            FBTest.sysout("baseBaseURL callback called");
        });
    }
    catch(exc)
    {
        FBTest.sysout("baseBaseURL ERROR "+exceptionToString(exc) );
    }
    finally
    {
        FBTest.compare("Bad baseUrl, needed for URL: baseURLIsNull.js", onErrorMessage, "Test bad baseURL ");
    }

    // ----------------------------------------------------------------------------------------------------
    FBTest.progress("Syntax Error test");


    if (baseLocalPath)
    {
        config.baseUrl = baseLocalPath + "/requirejs/tests/diagnostics/";
    }
    config.context = "testRequireJS" + Math.random(),  // to give each test its own loader,

    onErrorMessage = null;
    var joinSyntaxError = false;

    window.onError = function(msg) {
        FBTest.progress("window.onError "+msg);
    }

    try
    {
        require(config, ["syntaxErrorInsideDefine"], function(syntaxError)
        {
            FBTest.progress("syntaxErrorTest callback")
            if (joinSyntaxError)
                FBTest.compare("Some syntax error", onErrorMessage, "Test syntax error in define()");
            joinSyntaxError = true;
        });
    }
    catch(exc)
    {
        FBTest.sysout("syntaxErrorInsideDefine ERROR "+exceptionToString(exc) );

    }
    finally
    {
        if (joinSyntaxError)
            FBTest.compare("Some syntax error", onErrorMessage, "Test syntax error in define()");
        joinSyntaxError = true;
    }
}
