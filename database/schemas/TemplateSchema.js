const {Schema,model}=require('mongoose')
const schema=new Schema({
 _id:{type:String,required:true},ownerId:{type:String,required:true,index:true},
 version:{type:Number,required:true,default:1,enum:[1]},definition:{type:Schema.Types.Mixed,required:true,immutable:true},
},{timestamps:true})
schema.index({ownerId:1,createdAt:-1})
module.exports=model('ObeyTemplate',schema)
