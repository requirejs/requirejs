require({
    baseUrl: 'jslib/'
});

require(['env!env/one', 'env!env/args', 'path'], function (one, args, path) {
    console.log("One's name: " + one.name);
    console.log("Args: " + args);
    console.log(path.dirname(args[0]));
    console.log(__filename);
    console.log(process.cwd());
    //build(args);
});
