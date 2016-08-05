#!/usr/bin/env node

'use strict'

const restClient = require('request-promise')
const express = require('express')
const morgan = require('morgan')
const _ = require('underscore')
const bodyParser = require('body-parser')
const session = require('express-session')
const moment = require('moment')
const Q = require('q')
const bluebird = require('bluebird')
const Await = require('asyncawait/await')
const Async = require('asyncawait/async')
const mongodb = require('mongodb')
const gju = require('geojson-utils')
const nodemailer = require('nodemailer')
const fs = require('fs')


module.exports = (() => {

    const adventureDir = 'adventures'
    const appProps = JSON.parse(fs.readFileSync('appProps.json', 'utf-8'))
    console.log('appProps', appProps)

    const serviceURL = '/mydata'
    const dbName = appProps.dbName || 'databaseName'
    const defaultDBConnection = appProps.mongoURL || `mongodb://localhost/${dbName}`
    const mongoCollectionName = appProps.collectionName || 'collectionName'

    let mongoClient = bluebird.promisifyAll(mongodb).MongoClient;

    let port = process.env.PORT || 5000

    let app = express()

    let dbURI = process.env.MONGODB_URI || defaultDBConnection
    let db

    console.log('dbURI', dbURI)
    mongoClient.connect(dbURI)
        .then(ddb => {
            console.log('connected to mongo')
            db = ddb
        })
        .catch(er => {
            console.log('error connecting to mongo', er)
        })

    app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, contentType");
        res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE");
        next();
    });

    app.use(express.static('.'))
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({
        extended: true
    }))

    let getData = (req, res) => {
        db.collection(mongoCollectionName)
            .find({})
            .sort({
                dateTime: -1
            })
            .limit(1)
            .toArray()
            .then(queryResult => {
                if (!queryResult || queryResult.length <= 0) {
                    res.status(404).json({
                        "result": "no data for you"
                    })
                } else {
                    res.json({
                        data: queryResult
                    })
                }
            })
            .catch(err => {
                console.log("error", err)
                res.status(500).json({
                    "error": err
                })
            })
    }


    let setData = (req, res) => {
        console.log('body ', req.body);
        if (!req.body) {
            console.log('body is missing')
            res.status(500).json({
                "error": "missing body"
            })
            return false
        }

        req.body.dateTime = moment().toDate()
        db.collection(mongoCollectionName).insertOne(req.body)
            .then((insertResult) => {
                res.status(201).json({
                    "insertResult": insertResult
                })
            })
            .catch((er) => {
                console.log('error on insert', er)
                res.status(500).json({
                    "error": er
                })
            })
    }

    let loadAdventureList = function(req, res, next) {
        let adventures = fs.readdirSync(adventureDir)
        let jsonAdventures = _.map(_.filter(adventures, a => {
            return a.indexOf('.DS_') === -1
        }), (advdirName) => {
            let meta = JSON.parse(fs.readFileSync(adventureDir + '/' + advdirName + '/' + 'meta.json', 'utf-8'))
            meta.name = advdirName
            return meta
        })
        res.json(jsonAdventures);
    }

    let loadAdventureDetails = function(req, res, next) {
        console.log('query', req.query)
        let images = _.filter(fs.readdirSync(adventureDir + '/' + req.query.name), fn => {
            return fn.match(/^.*?(.png|.jpg|.gif)$/)
        })
        console.log('images', images)
        let meta = JSON.parse(fs.readFileSync(adventureDir + '/' + req.query.name + '/' + 'meta.json', 'utf-8'))
        let newImages = _.object(_.map(meta.images, (value, key) => {
            let matchingFile = _.find(images, i => {
                return i.startsWith(key)
            })
            return [matchingFile,value]
        }))
        meta.images = newImages
        meta.name = req.query.name

        res.json(meta);
    }

    app.get('/loadAdventureList', loadAdventureList)
    app.get('/loadAdventureDetails', loadAdventureDetails)

    app.post(serviceURL, setData)
    app.get(serviceURL, getData)

    app.listen(port, '0.0.0.0', () => {
        console.log(`listening on ${port}`)
    })

})()
