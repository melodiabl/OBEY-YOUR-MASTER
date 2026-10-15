const Counter=require('../../database/schemas/ModerationCounterSchema')
const Moderation=require('../../database/schemas/ModerationSchema')
function createCaseAllocator(counter=Counter,cases=Moderation) {
 return async guildId=>{
  const last=await cases.findOne({guildId}).sort({caseId:-1}).select('caseId').lean()
  const highest=Number.isSafeInteger(last?.caseId)&&last.caseId>0?last.caseId:0
  try {await counter.updateOne({_id:guildId},{$max:{value:highest}},{upsert:true})}
  catch(error){if(error?.code!==11000)throw error;await counter.updateOne({_id:guildId},{$max:{value:highest}})}
  const result=await counter.findOneAndUpdate({_id:guildId},{$inc:{value:1}},{new:true})
  if(!Number.isSafeInteger(result?.value)||result.value<1)throw new Error('Invalid moderation counter')
  return result.value
 }
}
module.exports={createCaseAllocator,nextCaseId:createCaseAllocator()}
