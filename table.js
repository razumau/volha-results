var collectionName = 'results_new',
    dbUrl = 'mongodb://localhost:27017/results',
    Q = require('q'),
    request = require('request')

var Table = function(settings) {

    if (!this || !(this instanceof Table)) {
        return new Table(settings);
    }

    this.url = settings.url
    this.columns = settings.columns
    this.check = settings.check
    this.sort = settings.sort
    this.sort2 = settings.sort2
    this.sort3 = settings.sort3
    this.order = settings.order
    this.sheet = settings.sheet
    this.fetchRating = settings.fetchRating
    this.release = settings.release
    this.interval = settings.interval
    this.table = ''
    this.deferredForTabletop // = Q.defer()

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

            var collection = db.collection(collectionName)

            var d = collection.findOne({
                    "url": url,
                },
                function(error, document) {
                    
                    if (document)
                        t = document.table
                    if (error)
                        console.log(new Date() + ' db error: ' + error)
                    db.close()
                    deferred.resolve(t)

                })

        })
        return deferred.promise
    },

    runTabletop: function runTabletop() {
        var Tabletop = require('tabletop')
        try {
            console.log(new Date() + ' starting tabletop')
            Tabletop.init({
                key: this.url,
                callback: this.createTable,
                simpleSheet: !this.sheet,
                wanted: [this.sheet],
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
            isEmpty = (v[column] === '' || v[column] === ' ')
        })

        if (isEmpty) {
            return
        }

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
        var MongoClient = require('mongodb').MongoClient,
            that = this

        MongoClient.connect(dbUrl, function(err, db) {

            var collection = db.collection(collectionName)
            console.log(new Date() + ' saving to db')
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
                    if (error)
                        console.log('db error: ' + error)
                    db.close()
                    return result
                })

        })
    },

    createTable: function createTable(data, tabletop) {

        if (!tabletop.simpleSheet) {
            data = tabletop.sheets(this.sheet).all()
        }

        if (this.fetchRating) {

            this.sort = 'рейтинг'

            if (this.columns.indexOf('рейтинг') === -1) {
                this.columns.push('рейтинг')
            }

            var that = this
            var fetchedRatings = 0

            console.log(new Date() + 'fetching ratings')

            data.forEach(function (v, index) {

                if (!v['рейтинг']) {

                    request('http://rating.chgk.info/api/teams/'
                                + v.id
                                + '/rating/' 
                                + that.release 
                                + '.json',
                             function (error, response, body) {

                                body = JSON.parse(body)
                                v['рейтинг'] = parseInt(body.rating_position)

                                if (isNaN(v['рейтинг'])) {
                                    v['рейтинг'] = 9999
                                }

                                fetchedRatings++

                                if (fetchedRatings === data.length - 1) {
                                    that.sortAndPush(data)
                                }
                             })
                    }
                })
        } else {
            this.sortAndPush(data)
        }
    },

    sortAndPush: function (data) {

        var tableArray = [],
            count = 1,
            that = this

        if (this.sort) {
            console.log(new Date() + ' sorting');
            data.sort(function(a, b) {
                var result =  b[that.sort] - a[that.sort]
                if (that.order)
                    result *= that.order
                if (!that.sort2 || result) {                 
                    return result
                } else {
                    result = b[that.sort2] - a[that.sort2]
                    if (!that.sort3 || result) {
                        return result
                    } else {
                        return b[that.sort3] - a[that.sort3]
                    }

                }
            })
        }

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
