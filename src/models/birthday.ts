const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const birthdaySchema = new Schema({
    person: {
        type: String,
        required: true
    },
    birthdayDate: {
        type: Date,
        required: true
    }
}, { timestamps : true});

const birthday = mongoose.model('birthday', birthdaySchema);
module.exports = birthday;