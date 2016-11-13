var mongoose = require('mongoose');
var Schema = mongoose.Schema;
// var user = require('./account');
// var Poll = require('./poll');
var Log = new Schema({
	ip: String,
    voter: {
        type: Schema.ObjectId,
        ref: 'Account'
    },
    poll: {
    	type: Schema.ObjectId,
    	ref: 'Poll'
    },
    date: {type: Date, defalut: Date.now},
 });

module.exports = mongoose.model('Log', Log);
