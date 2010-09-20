//The traditional nodejs http example

require(['sys', 'foo', 'http', 'alpha/foo'], function (sys, foo, http, alphaFoo) {
    http.createServer(function (req, res) {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('Hello ' + foo.name + '\nHello ' + alphaFoo.name + '\n');
    }).listen(8000);
    sys.puts('Server running at http://127.0.0.1:8000/');
});
