var options = '',
    table = ''

module.exports = function(settings) {

    options = settings

    var Tabletop = require('tabletop')
    try {
        Tabletop.init({
            key: options.url,
            callback: createTable,
            simpleSheet: true
        })
    } catch (error) {
        console.log(error)
    }

    return {
        html: function() {
            return table
        }
    }
}

function addToTable(array, v, number, columns) {

    var isEmpty = false

    columns.forEach(function isRowEmpty (column, index) {
        isEmpty = (v[column] == '' || v[column] == ' ')
        console.log(v[column])
    })

    if (isEmpty) return

    array.push('<tr><td>')
    array.push((number).toString())
    array.push('</td>')

    columns.forEach(function(column, index) {
        array.push('<td>')
        if (v[options.check])
            array.push('<b>')
        array.push(v[column])
        if (v[options.check])
            array.push('</b>')
        array.push('</td>')
    })

    array.push('</tr>')
}

function saveToDb() {
    var MongoClient = require('mongodb').MongoClient,
        assert = require('assert');

    var url = 'mongodb://localhost:27017/results'

    MongoClient.connect(url, function(err, db) {
        assert.equal(null, err)
        console.log("Connected correctly to the server")

        var collection = db.collection('results_test')

        collection.insert([{
            url: options.url,
            table: table,
            time: new Date()
        }], function (error, result) {
            assert.equal(err, null)
           
        }
        )

        db.close()
    });
}

function createTable(data) {
    var tableArray = [],
        count = 1

    data.forEach(function(v, index) {
        addToTable(tableArray, v, count++, options.columns)
    })

    table = tableArray.join('')
    saveToDb()

}
