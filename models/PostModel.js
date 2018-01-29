var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var PostSchema = new Schema({
	'author' : String,
	'date' : String,
	'excerpt' : String,
	'title' : String,
	'content' : String,
	'published' : Boolean,
	'categories': Array,
});

module.exports = mongoose.model('Post', PostSchema);