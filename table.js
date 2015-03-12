var options = '',
    table = '',
    collectionName = 'results_test2',
    dbUrl = 'mongodb://localhost:27017/results',
    Q = require('q')

var deferredForTabletop = Q.defer()

module.exports = function(settings) {

    options = settings
    var tabletop, data

    var deferred = Q.defer()

    deferred.promise.
    then(function(res) {
        console.log('res: ' + res)
    })

    deferred.resolve(readTable(options.url))

    console.log('table: ' + table)

    if (!table || table == '') {

        runTabletop()

        deferredForTabletop.promise.then(function(table){
                return saveToDb()
        })  
    }

    return {
        html: function() {
            if (table)
                return table
            else
                return readTable(options.url)
        }
    }
}

function readTable(url) {

    var deferred = Q.defer()

    var MongoClient = require('mongodb').MongoClient,
        t = null

    MongoClient.connect(dbUrl, function(err, db) {
        //assert.equal(null, err)
        console.log("Connected to read table")
        var collection = db.collection(collectionName)

        //console.log(collection.findOne)

        var d = collection.findOne({
                "url": options.url,
            },
            function(error, document) {
                if (document)
                    t = document.table
                console.log('db error: ' + error)
                db.close()
                deferred.resolve(t)

            })

    })
    return deferred.promise
}

function runTabletop() {
    var Tabletop = require('tabletop'),
        tabletop
    try {
        tabletop = Tabletop.init({
            key: options.url,
            callback: createTable,
            simpleSheet: true
        })
    } catch (error) {
        console.log(error)
    }
}

function addToTable(array, v, number, columns) {

    var isEmpty = false

    columns.forEach(function isRowEmpty(column, index) {
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
    var MongoClient = require('mongodb').MongoClient
    //var deferred = Q.defer()

    MongoClient.connect(dbUrl, function(err, db) {
        console.log("Connected to save table")

        var collection = db.collection(collectionName)

        collection.insert([{
            url: options.url,
            table: table,
            time: new Date()
        }], function(error, result) {
            console.log('db error: ' + error)
            db.close()
            return result
        })
        
    })
}

function createTable(data) {
    var tableArray = [],
        count = 1

    data.forEach(function(v, index) {
        addToTable(tableArray, v, count++, options.columns)
    })

    table = tableArray.join('')

    deferredForTabletop.resolve(table)
}

function updateTable() {
    console.log(tabletop)
}
