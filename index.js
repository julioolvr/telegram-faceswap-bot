var dotenv = require('dotenv');
dotenv.config({ silent: true });
dotenv.load();

require('babel/register');

require('./src/server').listen(process.env.PORT, function() {
  var host = this.address().address;
  var port = this.address().port;

  console.log('App listening at http://%s:%s', host, port);
});
