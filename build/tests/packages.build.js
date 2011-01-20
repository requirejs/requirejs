({
    baseUrl: "../../tests/packages/",
    dir: "builds/packages",
    optimize: "none",

    paths: {
        'alpha/replace' : 'replace'
    },
    packagePaths: {
        'pkgs': [
            'alpha',
            {
                name: 'beta',
                location: 'beta/0.2',
                lib: 'scripts',
                main: 'scripts/beta'
            },
            'dojox/chair',
            {
                name: 'dojox/table',
                lib: '.',
                main: 'table'
            }
        ]
    },
    packages: [
        {
            name: 'bar',
            location: 'bar/0.4',
            lib: 'scripts',
            main: 'scripts/main'
        },
        {
            name: 'foo',
            location: 'foo'
        },
        {
            name: 'funky',
            main: 'index'
        },
        {
            name: 'baz',
            location: 'baz',
            main: 'lib/index'
        },
        {
            name: 'dojox/window',
            location: 'dojox/window',
            lib: '.',
            main: 'window'
        }
    ],

    modules: [
        {
            name: "packages-tests"
        }
    ]
})
