var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var MatchSchema = new Schema({
  'PsuedoKey' : String,
  'Sport' : String,
  'League': String,
  'Date' : Date,
  'Team1': String,
  'Team2': String,
  'MatchInstances' : [{
    'PsuedoKey': String,
    'Service' : String,
    'Region' : String,
    'Team1' : {
      'Name': String,
      'Price': String
    },
    'Team2' : {
      'Name': String,
      'Price': String
    },
    'DrawPrice' : String
  }]
});

module.exports = mongoose.model('Match', MatchSchema);
