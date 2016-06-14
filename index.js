var dotenv = require('dotenv')
dotenv.config({ silent: true })
dotenv.load()

var path = require('path')
global.rootPath = path.resolve(__dirname)

require('babel/register')

var App = require('./src/server')
var app = new App()
app.start()
