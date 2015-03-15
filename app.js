var express = require('express'),
	app = express(),
	table = require('./table.js'),
	Q = require('q'),
	tables = {}


var params = [{
	//studentList
	url: 'https://docs.google.com/spreadsheet/pub?hl=en_US&hl=en_US&key=1_mNN7NPsxEUaDuH_j6SN4KZLvYXQeLWXiWKZCW_y2c8&output=html',
	columns: ['команда', 'город'],
	check: 'эк',
	interval: 600000
}, {
	//schoolList
	url: 'https://docs.google.com/spreadsheet/pub?hl=en_US&hl=en_US&key=1fbaSXZ_pUMNRAi3UT4qysz5tl6ZDTIRwyTqvIzgEZTI&output=html',
	columns: ['команда', 'город', 'синхрон'],
	interval: 1500000
}]

function initializeTables() {
	params.forEach(loadTable)
	params.forEach(function(options) {
		setInterval(function() {
			updateTable(options)
		}, options.interval)
	})
}

function loadTable(options) {
	var deferred = Q.defer()
	var tab

	deferred.promise.then(function(t) {
		tables[options.url] = t
		t.init()
	}).then(function(t) {

	})

	deferred.resolve(table(options))

}

function updateTable(options) {

	tables[options.url].updateTable()
}


initializeTables()

app.all('/*', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*")
	res.header("Access-Control-Allow-Headers", "X-Requested-With")
	next()
})

app.get('/:key', function(req, res) {
	console.log(req.params.key)
	//res.send(req.toString())
	var url = 'https://docs.google.com/spreadsheet/pub?hl=en_US&hl=en_US&key=' + 
		req.params.key + 
		'&output=html'
	//console.log(url)
	//console.log(tables[0])
	res.send(tables[url].table)

})

var server = app.listen(80, function() {

	var host = server.address().address
	var port = server.address().port

	console.log('listening at http://%s:%s', host, port)

})
