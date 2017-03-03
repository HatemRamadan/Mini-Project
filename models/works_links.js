var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var schema = new Schema({
  username: {type : String},
  title: {type: String},
  link : {type: String}
});

var works_links = mongoose.model("works_links", schema);
module.exports = works_links;
