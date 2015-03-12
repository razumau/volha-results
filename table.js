var options = '',
    table = '',
    collectionName = 'results_test',
    dbUrl = 'mongodb://localhost:27017/results',
    //async = require('async'),
    Q = require('q')

module.exports = function(settings) {

        options = settings
        var tabletop, data

        var deferred = Q.defer()

        deferred.promise.
        then(function(res) {
            console.log('res: ' + res)
        })

        deferred.resolve(readTable(options.url))

        //console.log('table: ' + table)

        if (!table) {
            tabletop = runTabletop()


            /*async.series([
                tabletop.fetch
                /*{
                    
                    tabletop.fetch()
                    callback(null, tabletop)
                },
                function (callback) {
                    console.log(tabletop.data)
                    data = tabletop.data()
                    callback(null, data)
                },
                function(callback) {
                    createTable(data)
                    callback(null, table)
                }
            ],
            function callback(error, results) {
                if (error)
                    console.log(error)
            })*/
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
                    //callback: createTable,
                    wait: true,
                    simpleSheet: true
                })
            } catch (error) {
                console.log(error)
            }

            return tabletop
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
            var MongoClient = require('mongodb').MongoClient,
                assert = require('assert')

            MongoClient.connect(dbUrl, function(err, db) {
                assert.equal(null, err)
                console.log("Connected to save table")

                var collection = db.collection(collectionName)

                collection.insert([{
                    url: options.url,
                    table: table,
                    time: new Date()
                }], function(error, result) {
                    assert.equal(err, null)

                })

                db.close()
            })
        }

        function createTable(data) {
            var tableArray = [],
                count = 1

            data.forEach(function(v, index) {
                addToTable(tableArray, v, count++, options.columns)
            })

            table = tableArray.join('')
            saveToDb()

            //setInterval(saveToDb, options.interval)

            return table
        }

        function updateTable() {
            console.log(tabletop)
        }
