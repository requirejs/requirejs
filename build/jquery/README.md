# jQuery building

This directory builds requirejs in configurations for use with jquery.

Some changes need to be made to integrate jQuery with RequireJS:

* outro.js: add this:
    require.def("jquery", function() { return jQuery; })
