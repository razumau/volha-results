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
	interval: 60000000
}, {
	//schoolList
	url: 'https://docs.google.com/spreadsheet/pub?hl=en_US&hl=en_US&key=1fbaSXZ_pUMNRAi3UT4qysz5tl6ZDTIRwyTqvIzgEZTI&output=html',
	columns: ['команда', 'город', 'синхрон'],
	sort: 'синхрон',
	order: -1,
	interval: 600000
},
{
	//своя игра
	url: 'https://docs.google.com/spreadsheet/pub?hl=en_US&hl=en_US&key=1LsvBGl8ZgxDQIaHLcLpHqAxuHOmUG1PBTasB2YMsFAw&output=html',
	columns: ['игрок', 'сумма'],
	interval: 12000000,
	sort: 'сумма',
	sort2: 'пятьдесят',
	sort3: 'сорок'
},
{
	//школьное чгк
	url: 'https://docs.google.com/spreadsheet/pub?hl=en_US&hl=en_US&key=1ER82RT50Rufw558V-1Fu2txtlpjrNIGwuw_jsWmhWG4&output=html',
	columns: ['команда', 'сумма', 'первый', 'второй', 'третий', 'четвёртый', 'пятый'],
	interval: 12000000,
	sort: 'сумма',
	sort2: 'рейтинг'
},
{
	//школьная своя игра
	url: 'https://docs.google.com/spreadsheet/pub?hl=en_US&hl=en_US&key=19XZhJjgbKue4HYan7LGVrCd7l98tvE9EID3PrN98wuk&output=html',
	columns: ['команда', 'сумма'],
	interval: 12000000,
	sort: 'сумма',
	sort2: 'пятьдесят',
	sort3: 'сорок'
}
]

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
		console.log(tables[options.url])
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
	if (tables[url])
		res.send(tables[url].table)
	else
		res.send('There\'s no table with this key')

})

var server = app.listen(3000, function() {

	var host = server.address().address
	var port = server.address().port

	console.log('listening at http://%s:%s', host, port)

})
