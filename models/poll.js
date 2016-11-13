var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var user = require('./account');
var log = require('./log');

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

Poll.pre('remove', function(next){
    this.model('Log').remove({poll:this._id}, next);
});


module.exports = mongoose.model('Poll', Poll);