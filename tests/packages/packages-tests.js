require({
        baseUrl: require.isBrowser ? "./" : "./packages/",
        paths: {
            'alpha/replace' : 'replace'
        },
        packagePaths: {
            'pkgs': [
                'alpha', {
                    name: 'beta',
                    location: 'beta/0.2',
                    lib: 'scripts',
                    main: 'beta'
                }
            ]
        },
        packages: {
            bar: {
                location: 'bar/0.4',
                lib: 'scripts'
            },
            foo: {
                location: 'foo'
            },
            baz: {
                location: 'baz',
                main: 'index'
            }
        }
    },
       ["require", "alpha", "alpha/replace", "beta", "beta/util", "bar", "baz", "foo", "foo/second"],
function(require,   alpha,   replace,         beta,   util,        bar,   baz,   foo,   second) {
    doh.register(
        "packages", 
        [
            function packages(t){
                t.is("alpha", alpha.name);
                t.is("fake/alpha/replace", replace.name);
                t.is("beta", beta);
                t.is("beta/util", util.name);
                t.is("bar", bar.name);
                t.is("0.4", bar.version);
                t.is("baz", baz.name);
                t.is("0.4", baz.barDepVersion);
                t.is("foo", baz.fooName);
                t.is("foo", foo.name);
                t.is("alpha", foo.alphaName);
                t.is("foo/second", second.name);
                t.is((require.isBrowser ? "./foo/lib/../data.html" : "./packages/foo/lib/../data.html"), require.nameToUrl('foo/../data', '.html'));
            }
        ]
    );
    doh.run();
});
