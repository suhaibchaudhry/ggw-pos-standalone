var wkhtmltopdf = require('wkhtmltopdf');
var express = require('express');
var bodyParser = require('body-parser');
var tmp = require('tmp');
var lp = require("printer-lp");

var app = express();
app.use(bodyParser.json());

app.post('/', function(req, res){
    //console.dir(req.body.ticket);
    if(req.body.ticket) {
      tmp.file({postfix: '.pdf'}, function _tempFileCreated(err, path, fd) {
	if (!err) {
		console.log("file: "+path);
		wkhtmltopdf(req.body.ticket, {
			pageSize: 'letter',
			output: path,
			footerRight: "[title] - [page] of [topage]",
			footerFontSize: 8,
			marginTop: 5
		}, function() {
			lp.printFile(path, {}, "Invoice Print");	
		});
	}
      });
      res.send("Ticket sent to printer.");
    } else {
      res.send("Printing failed. Ticket not found.");
    }
});

app.listen(3000);
