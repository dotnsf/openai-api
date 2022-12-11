//. app.js
var express = require( 'express' ),
    bodyParser = require( 'body-parser' ),
    axios = require( 'axios' ),
    request = require( 'request' ),
    app = express();

app.use( express.static( __dirname + '/public' ) );
app.use( bodyParser.urlencoded( { extended: true } ) );
app.use( bodyParser.json() );
app.use( express.Router() );

var settings_cors = 'CORS' in process.env ? process.env.CORS : '';  //. "http://localhost:8080,https://xxx.herokuapp.com"
app.all( '/*', function( req, res, next ){
  //console.log( req.headers );
  if( settings_cors ){
    var origin = req.headers.origin;
    if( origin ){
      var cors = settings_cors.split( " " ).join( "" ).split( "," );

      //. cors = [ "*" ] への対応が必要
      if( cors.indexOf( '*' ) > -1 ){
        res.setHeader( 'Access-Control-Allow-Origin', '*' );
        res.setHeader( 'Vary', 'Origin' );
      }else{
        if( cors.indexOf( origin ) > -1 ){
          res.setHeader( 'Access-Control-Allow-Origin', origin );
          res.setHeader( 'Vary', 'Origin' );
        }
      }
    }
  }
  next();
});

app.get( '/ping', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  res.write( JSON.stringify( { status: true, message: 'PONG' }, null, 2 ) );
  res.end();
});

var settings_apikey = 'API_KEY' in process.env ? process.env.API_KEY : '';

app.post( '/api/query', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );
  var text = req.body.text;

  /*
  var db_headers = { 
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + settings_apikey 
  };
  var data = {
    prompt: text,
    model: 'text-davinci-003',
    max_tokens: 4000
  };
  var option = {
    url: 'https://api.openai.com/v1/completions',
    method: 'GET',
    json: data,
    headers: db_headers
  };
  request( option, ( err, res0, body ) => {
    if( err ){
      res.status( 400 );
      res.write( JSON.stringify( { status: false, error: err }, null, 2 ) );
      res.end();
    }else{
      console.log( {body} );
      res.write( JSON.stringify( { status: true, result: body }, null, 2 ) );
      res.end();
    }
  });
  */
  axios.get( 'https://api.openai.com/v1/completions', {
    prompt: text,
    model: 'text-davinci-003',
    max_tokens: 4000
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + settings_apikey 
    }
  }).then( function( result ){
    console.log( {result} );
    res.write( JSON.stringify( { status: true, result: result }, null, 2 ) );
    res.end();
  }).catch( function( err ){
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: err }, null, 2 ) );
    res.end();
  });
});

var port = process.env.PORT || 8080;
app.listen( port );
console.log( "server starting on " + port + " ..." );

module.exports = app;
