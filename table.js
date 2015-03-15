var collectionName = 'results_test5',
    dbUrl = 'mongodb://localhost:27017/results',
    Q = require('q')

var Table = function(settings) {

    if (!this || !(this instanceof Table)) {
        return new Table(settings);
    }

    this.url = settings.url
    this.columns = settings.columns
    this.check = settings.check
    this.interval = settings.interval
    this.table = ''
    this.deferredForTabletop// = Q.defer()

}


module.exports = Table

Table.prototype = {

    init: function init() {
        var deferred = Q.defer()
        var runTabletop = this.runTabletop
        var that = this


        deferred.promise.then(function(t) {
            that.table = t
            if (!that.table || that.table == '') {
                that.updateTable.call(that, t)
            }
        })

        deferred.resolve(this.readTable(this.url))
        return deferred
    },

    updateTable: function updateTable(t) {

        this.deferredForTabletop = Q.defer()
        if (typeof t === 'undefined')
            t = this.table

        //if (!that.table || that.table == '') {

        console.log('running tabletop')
        this.runTabletop()

        var that = this

        this.deferredForTabletop.promise.then(function(table) {

            return that.saveToDb()
        })

    },

    readTable: function readTable(url) {

        var deferred = Q.defer()

        var MongoClient = require('mongodb').MongoClient,
            t = null,
            url = this.url
        MongoClient.connect(dbUrl, function(err, db) {
            //assert.equal(null, err)
            console.log("Connected to read table")
            var collection = db.collection(collectionName)

            var d = collection.findOne({
                    "url": url,
                },
                function(error, document) {
                    //console.log(document)
                    if (document)
                        t = document.table
                        //console.log('db error: ' + error)
                    db.close()
                    deferred.resolve(t)

                })

        })
        return deferred.promise
    },

    runTabletop: function runTabletop() {
        console.log('asdfasdf')
        var Tabletop = require('tabletop')

        try {
            console.log('starting tabletop now')
            Tabletop.init({
                key: this.url,
                callback: this.createTable,
                simpleSheet: true,
                callbackContext: this
            })
        } catch (error) {
            console.log(error)
        }
    },

    addToTable: function addToTable(array, v, number, columns, check) {

        var isEmpty = false
        var italic = check && (!v[check] || v[check] === '')

        columns.forEach(function isRowEmpty(column, index) {
            isEmpty = (v[column] == '' || v[column] == ' ')
        })

        if (isEmpty) return

        array.push('<tr><td>')
        array.push((number).toString())
        array.push('</td>')

        columns.forEach(function(column, index) {
            array.push('<td>')
            
            if (italic)
                array.push('<i>')
            array.push(v[column])
            if (italic)
                array.push('</i>')
            array.push('</td>')
        })

        array.push('</tr>')
    },

    saveToDb: function saveToDb() {
        var MongoClient = require('mongodb').MongoClient
            //var deferred = Q.defer()
        var that = this
        console.log('in saveToDb')
        MongoClient.connect(dbUrl, function(err, db) {
            console.log("Connected to save table")

            var collection = db.collection(collectionName)

            collection.update({
                    url: that.url
                }, {
                    url: that.url,
                    table: that.table,
                    time: new Date()
                }, {
                    upsert: true
                },
                function(error, result) {
                    //console.log('db error: ' + error)
                    db.close()
                    return result
                })

        })
    },

    createTable: function createTable(data) {
        var tableArray = [],
            count = 1
        console.log('in createTable')
        var that = this
        data.forEach(function(v, index) {
            that.addToTable(tableArray, v, count++, that.columns, that.check)
        })

        this.table = tableArray.join('')
        this.deferredForTabletop.resolve(this.table)
    },

    html: function html() {
        return this.table
    }
}
