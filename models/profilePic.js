var express = require('express');	
var fs = require('fs');
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var schema = new Schema({
    username: {type: String, required: true },
    img: { data: Buffer, contentType: String }
});

var A = mongoose.model('A', schema);
module.exports = A;
