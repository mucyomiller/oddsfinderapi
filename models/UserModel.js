var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var UserSchema = new Schema({
	'mobile_number' : String,
	'football_team' : String,
	'email' : String,
	'member_type' : String,
	'password' : String,
	'location': Object,
	'country' : String,
});

module.exports = mongoose.model('User', UserSchema);
