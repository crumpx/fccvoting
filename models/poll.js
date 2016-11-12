var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var user = require('./account');

var Poll = new Schema({
    title: {
        type: String,
        required: true
    },
    options: [{text:String, count: {type: Number, default: 0}}],
    author: {
        type: Schema.ObjectId,
        ref: 'Account',
    },
    disabled: {
        type:Boolean,
        default: false,
    },
    date: {type: Date, defalut: Date.now},
});


module.exports = mongoose.model('Poll', Poll);