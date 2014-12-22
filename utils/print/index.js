var wkhtmltopdf = require('wkhtmltopdf');
var express = require('express');
var bodyParser = require('body-parser');
var tmp = require('tmp');
var exec = require('child_process').exec;
var glob = require("glob");

var app = express();
app.use(bodyParser.json());

app.post('/', function(req, res){
    if(req.body.ticket) {
      tmp.file({postfix: '.pdf'}, function _tempFileCreated(err, path, fd) {
		if (!err) {
			console.log("file: "+path);
			wkhtmltopdf(req.body.ticket, {
				pageSize: 'letter',
				output: path,
				footerRight: "[title] - [page] of [topage]",
				footerFontSize: 8,
				minimumFontSize: 10
			}, function() {
				exec('lp '+path);
			});
		}
      });
      res.send("Ticket sent to printer.");
    } else {
      res.send("Printing failed. Ticket not found.");
    }
});

app.get('/drawer', function(req, res) {
	glob("/dev/ttyUSB*", {}, function (er, files) {
		for(i in files) {
			exec('echo "open" > '+files[i]);
		}
	});
	res.send("Drawer ejected.");
});

app.listen(3000);
