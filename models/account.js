var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var Account = new Schema({
    username: String,
    password: String,
    email: String,
    created: {type: Date, defalut: Date.now}
});

Account.plugin(passportLocalMongoose);

module.exports = mongoose.model('Account', Account);