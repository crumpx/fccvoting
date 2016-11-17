var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var user = require('./account');
var Log = require('./log');

var Poll = new Schema({
    title: {
        type: String,
        required: true
    },
    story: String,
    options: [{
        text:String, 
        count: {type: Number, default: 0},
        color:{type: String}
        }],
    author: {
        type: Schema.ObjectId,
        ref: 'Account',
    },
    disabled: {
        type:Boolean,
        default: false,
    },
},{
    timestamps: true
});

Poll.pre('remove', function(next){
    this.model('Log').remove({poll:this._id}, next);
});

module.exports = mongoose.model('Poll', Poll);