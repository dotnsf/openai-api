//. app.js
var express = require( 'express' ),
    bodyParser = require( 'body-parser' ),
    { Configuration, OpenAIApi } = require( 'openai' ),
    app = express();

require( 'dotenv' ).config();

app.use( express.static( __dirname + '/public' ) );
app.use( bodyParser.urlencoded( { extended: true } ) );
app.use( bodyParser.json() );
app.use( express.Router() );

var IGNORE_PHRASE = 10;  //. 結果の最初のフレーズがこの長さ以下だったら無視する

var settings_cors = 'CORS' in process.env ? process.env.CORS : '';  //. "http://localhost:8080,https://xxx.herokuapp.com"
app.all( '/*', function( req, res, next ){
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
var settings_organization = 'ORGANIZATION' in process.env ? process.env.ORGANIZATION : '';
var configuration = new Configuration({ apiKey: settings_apikey, organization: settings_organization });
var openai = new OpenAIApi( configuration );
//console.log( openai );

app.get( '/api/engines', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var result = await openai.listEngines();
  res.write( JSON.stringify( { status: true, result: result.data.data }, null, 2 ) );
  res.end();
});

app.get( '/api/models', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var result = await openai.listModels();
  res.write( JSON.stringify( { status: true, result: result.data.data }, null, 2 ) );
  res.end();
});

app.get( '/api/model/:id', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var id = req.params.id;
  var result = await openai.retrieveModel( id );
  res.write( JSON.stringify( { status: true, result: result.data }, null, 2 ) );
  res.end();
});

app.post( '/api/complete', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );
  var model = ( req.body.model ? req.body.model : 'gpt-3.5-turbo'/*'text-davinci-003'*/ );
  var max_tokens = ( req.body.max_tokens ? parseInt( req.body.max_tokens ) : 4000 );
  var prompt = req.body.prompt;

  var option = {
    model: model,
    prompt: prompt,
    //messages: [
    //  { role: "user", content: prompt }
    //],
    max_tokens: max_tokens
  };
  if( req.body.temperature ){
    option.temperature = parseFloat( req.body.temperature );
  }
  if( req.body.top_p ){
    option.top_p = parseFloat( req.body.top_p );
  }
  if( req.body.n ){
    option.n = parseInt( req.body.n );
  }

  try{
    var result = await openai.createCompletion( option );
    var answer = result.data.choices[0].text;

    //. 最初の "\n\n" 以降が正しい回答？
    var tmp = answer.split( "\n\n" );
    if( tmp.length > 1 && tmp[0].length < IGNORE_PHRASE ){
      tmp.shift();
      answer = tmp.join( "\n\n" );
    }

    res.write( JSON.stringify( { status: true, result: answer }, null, 2 ) );
    res.end();
  }catch( err ){
    console.log( err );
    var status_code = ( err.response && err.response.status ? err.response.status : 400 );
    var status_text = ( err.response && err.response.statusText ? err.response.statusText : 'unknown error' );
    res.status( status_code )
    res.write( JSON.stringify( { status: false, error: status_text }, null, 2 ) );
    res.end();
  }
});

app.post( '/api/image', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );
  var n = ( req.body.n ? parseInt( req.body.n ) : 1 );
  var size = ( req.body.size ? req.body.size : '256x256' );
  var format = ( req.body.format ? req.body.format : 'url' /* 'url' or 'b64_json' */ );  //. response_format
  var prompt = req.body.prompt;

  var option = {
    prompt: prompt,
    n: n,
    size: size,
    response_format: format
  };

  var result = await openai.createImage( option );
  //console.log( result.data );
  //result.data.data[i].b64_json = "iVBORw0...";
  //. "data:image/png;base64," を付けると <img src="xx" に使える

  res.write( JSON.stringify( { status: true, result: result['data']['data'] }, null, 2 ) );
  res.end();
});

var port = process.env.PORT || 8080;
app.listen( port );
console.log( "server starting on " + port + " ..." );

module.exports = app;
