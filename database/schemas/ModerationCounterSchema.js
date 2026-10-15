const {Schema,model}=require('mongoose')
module.exports=model('ModerationCounter',new Schema({_id:String,value:{type:Number,default:0}},{timestamps:true}))
