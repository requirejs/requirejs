/*global doh */
require({
        baseUrl: './',
        map: {
            '*': {
                //Remove 'sub/level' from
                //any module ID, so that the
                //rest of the modules ID is
                //treated as top level.
                'sub/level': '',

                //This means, "prefix with modules/ unless
                //there is a more specific map config at
                //this level".
                '' : 'modules'
            },
            'util': {
                //If util asks for any modules,
                //add a 'vendor/' prefix to the
                //top level part.
                '' : 'vendor'
            },

            //This is not supported. This could be
            //considered like '*' but it looks weird 
            //at the top level of this config, and '*' 
            //is existing API. Using '*' for the other 
            //areas where '' is used would be confusing,
            //does not read as clear as '' does. It
            //would read as a "all" selector vs a
            //module ID truncattion/replace string.
            '' : {
                'vendor': 'doesnotexist'
            }
        }
    },
    ['util/func', 'sub/level/a', 'e'],
    function(utilFunc, a) {
        'use strict';
        doh.register(
            'mapConfigTopLevel',
            [
                function mapConfigTopLevel(t){
                    t.is('e', e.name);
                    t.is('d', e.d.name);
                    t.is(true, e.d.adapted);
                    t.is(true, a.adapted);
                    t.is('d', a.name);
                }
            ]
        );
        doh.run();
    }
);
