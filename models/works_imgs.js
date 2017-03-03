var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var schema = new Schema({
  username: {type : String},
  title: {type: String},
  img : {data: Buffer, contentType: String}
});

var works_imgs = mongoose.model("works_imgs", schema);
module.exports = works_imgs;
