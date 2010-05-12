# FAQ: RequireJS Advanced Usage

### <a name="usage">How can I use a different variable name instead of require?</a>

RequireJS and its optimization tool need to be version 0.11 or higher for this to work.

You may have very strict global namespace requirements or you may be using code that already defines a require and you want to avoid interference. To do this requires two steps.

1) Modify the source of require.js to put in a wrapper like so:

    var myGlobalRequire = (function () {
        //Define a require object here that has any
        //default configuration you want for RequireJS. If
        //you do not have any config options you want to set,
        //just use an simple object literal, {}. You may need
        //to at least set baseUrl.
        var require = {
            baseUrl: '../'
        };

        //INSERT require.js CONTENTS HERE

        return require;
    }());

2) For any files you load with this new function, if those files reference require in any way, you will want to wrap them in an anonymous function to set the value of require to be your new function name defined in step 1:

    (function (require) {

        //Regular require references now work correctly in here.

    }(myGlobalRequire));

Following the step above should still allow you to use the optimization tool to combine scripts together effectively. You should not use the includeRequire optimization option, and instead if you want the require definition in the optimized script, reference your modified require.js directly.

Thanks to [Alex Sexton](http://alexsexton.com/) and [Tobie Langel](http://tobielangel.com/) for suggesting parts of this solution.
