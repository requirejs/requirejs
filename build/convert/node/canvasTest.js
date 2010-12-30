//Tested with nave, node 0.2.5,
//npm install canvas
//npm install express

'use strict';
/*jslint */
/*global require: false, console: false */

var Canvas = require('canvas'),
    express = require('express'),
    canvas = new Canvas(200, 200),
    ctx = canvas.getContext('2d'),
    app = express.createServer();


app.configure(function () {

    app.get('/', function (req, res) {
        res.send('hello world');
    });

    app.use(express.gzip());
    app.listen(3000);
});


ctx.font = '30px Impact';
ctx.rotate(0.1);
ctx.fillText("Awesome!", 50, 100);

var te = ctx.measureText('Awesome!');
ctx.strokeStyle = 'rgba(0,0,0,0.5)';
ctx.beginPath();
ctx.lineTo(50, 102);
ctx.lineTo(50 + te.width, 102);
ctx.stroke();

console.log('<img src="' + canvas.toDataURL() + '" />');