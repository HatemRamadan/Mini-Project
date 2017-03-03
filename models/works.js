var mongoose = require("mongoose");

var works = mongoose.Schema({
	title: String,
	link: String,
	img: {data: Buffer, contentType:String}
});
var _works = mongoose.model("_works", works);
module.exports = _works;