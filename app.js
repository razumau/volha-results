var express = require('express')
var app = express()
var Q = require('q')
var tables = {}

var params = [{
	//studentList
	url: 'https://docs.google.com/spreadsheet/pub?hl=en_US&hl=en_US&key=1_mNN7NPsxEUaDuH_j6SN4KZLvYXQeLWXiWKZCW_y2c8&output=html',
	columns: ['команда', 'город'],
	check: 'эк',
	interval: 10000
}, {
	//schoolList
	url: 'https://docs.google.com/spreadsheet/pub?hl=en_US&hl=en_US&key=1fbaSXZ_pUMNRAi3UT4qysz5tl6ZDTIRwyTqvIzgEZTI&output=html',
	columns: ['команда', 'город', 'синхрон'],
	interval: Infinity
}]

function initializeTables() {
	params.forEach(loadTable)
	params.forEach(function (options) {
		setInterval(function (options) {
			loadTable(options)
		}, options.interval)
	})
}

function loadTable(options) {
	//console.log(options)
	var deferred = Q.defer()

	deferred.promise.then(function(t) {
		tables(options.url) = t.html()
	})

	deferred.resolve(getTable(options))

}

function getTable(tableParams) {
	console.log(tableParams)
	var table = require('./table.js')
	var tab 
	var deferred = Q.defer()
	
	tab = table(tableParams)
	console.log(tableParams)

	deferred.resolve(tab)
	return deferred.promise

}

initializeTables()

app.get('/', function(req, res) {

	var t, result = ''

	var deferred = Q.defer()

	//console.log('t in app.get: ' + t)
	deferred.promise.then(function(t) {
		return t.html()
	}).then(function(result) {
		res.send(result)
	})
	deferred.resolve(getTable(params[0]))
		//console.log(result)


})

var server = app.listen(3000, function() {

	var host = server.address().address
	var port = server.address().port

	console.log('listening at http://%s:%s', host, port)

})

app.all('/*', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*")
	res.header("Access-Control-Allow-Headers", "X-Requested-With")
	next()
})
