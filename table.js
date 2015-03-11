var options = '',
    table = ''

module.exports = function(settings) {

    options = settings

    //console.log(this.options)

    /*var Tabletop = require('tabletop')
    try {
        Tabletop.init({
            key: options.url,
            callback: createTable,
            simpleSheet: true
        })
    } catch (error) {
        console.log(error)
    }*/

    var data = [{
        'команда': 'Я сегодня не могу',
        'город': 'Минск',
        rowNumber: 32
    }, {
        'команда': 'Маленькие люди',
        'город': 'Витебск',
        rowNumber: 33
    }, {
        'команда': 'Победоносный голос верующего',
        'город': 'Москва',
        rowNumber: 34
    }]

    createTable(data)
    saveToDb()


    return {
        html: function() {
            //console.log(table)
            return table
        }
    }
}

function addToTable(array, v, number, columns) {

    array.push('<tr><td>')
    array.push((number).toString())
    array.push('</td>')

    columns.forEach(function(column, index) {
        array.push('<td>')
        array.push(v[column])
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

        var collection = db.collection('results')

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

    //console.log(this)
    //console.log(options)



    data.forEach(function(v, index) {
        addToTable(tableArray, v, count++, options.columns)
    })


    console.log('data:\n' + data)
    return table = tableArray.join('')


}
