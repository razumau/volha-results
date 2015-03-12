var express = require('express')
var app = express()
var table = require('./table.js')
//var async = require('async')
var Q = require('q')

var i = 0

var studentList = {
	url: 'https://docs.google.com/spreadsheet/pub?hl=en_US&hl=en_US&key=1_mNN7NPsxEUaDuH_j6SN4KZLvYXQeLWXiWKZCW_y2c8&output=html',
	columns: ['команда', 'город'],
	check: 'эк',
	sort: 'рейтинг',
	interval: 120000
}

app.all('/*', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	next();
});

function getTable(tableParams) {
	var tab, result
	var deferred = Q.defer()

	tab = table(tableParams)

	deferred.resolve(tab)
	console.log('tab: ' + tab)
	return deferred.promise
/*
	async.series([
			function(callback) {
				console.log('first function')
				t = table(tableParams)
				callback(null, t)
			},
			function(callback) {
				console.log('second function')
				result = t.html()
				callback(null, result)
			}
		],
		function callback(error, results) {
			if (error)
				console.log(error)
		})
	return result*/

}

app.get('/', function(req, res) {

	var t, result = 'asdf'
	
	/*async.series([
			function(callback) {
				t = table(studentList)
				callback(null, t)
			},
			function(callback) {
				result = t.html()
				callback(null, result)
			}
		],
		function callback (error, results) {
			if (error) 
				console.log(error)
		})*/

	//result = 
	var deferred = Q.defer()
	console.log('t in app.get: ' + t)
	deferred.promise.then(function (t) {
		return t.html()
	}).then (function (result){
		res.send(result)
	})
	deferred.resolve(getTable(studentList))
	//console.log(result)

	
})

var server = app.listen(3000, function() {

	var host = server.address().address
	var port = server.address().port

	console.log('listening at http://%s:%s', host, port)

})
