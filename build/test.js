require({
    baseUrl: 'jslib/'
});

require(['env!env/one', 'env!env/args', 'path', 'fs'], function (one, args, path, fs) {
    console.log("One's name: " + one.name);
    console.log("Args: " + args);
    console.log('realpath ' + fs.realpathSync(args[0]));
    console.log(__filename);
    console.log(process.cwd());
    //build(args);
});
