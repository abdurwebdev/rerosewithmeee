const mongoose = require('mongoose');

const commentSchema = mongoose.Schema({
      content:String,
      post:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Post"
      },
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      }
},{
  timestamps:true
})

module.exports = mongoose.model("Comment",commentSchema);