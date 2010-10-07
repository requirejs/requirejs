//The traditional nodejs http example

require(['sys', 'foo', 'http', 'alpha/foo', 'text!alpha/hello.html'], function (sys, foo, http, alphaFoo, helloHtml) {
    http.createServer(function (req, res) {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.write('Hello ' + foo.name + '\nHello ' + alphaFoo.name + '\n');
        res.write(helloHtml)
        res.end('\n');
    }).listen(8000);
    sys.puts('Server running at http://127.0.0.1:8000/');
});
