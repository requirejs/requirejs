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
            },
            'vendor/nested': {
                'sub/level': 'modules'
            },
            'a': {
                'another/nested': ''
            }
        }
    },
    ['util/func', 'main'],
    function(utilFunc, main) {
        'use strict';
        doh.register(
            'mapConfigTopLevel',
            [
                function mapConfigTopLevel(t){
                    t.is('util/func', utilFunc.name);
                    t.is('d', utilFunc.d.name);
                    t.is('e', utilFunc.d.e.name);
                    t.is('b', main.b.name);
                    t.is('c', main.c.name);
                }
            ]
        );
        doh.run();
    }
);
