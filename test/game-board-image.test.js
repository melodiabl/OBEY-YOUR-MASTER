const test=require('node:test'),assert=require('node:assert/strict')
const {renderBoard}=require('../handlers/games/board-image')
test('full 15 by 10 snake board uses local OBEY tiles without Discord emoji limits',async()=>{
 const board=Array.from({length:10},(_,y)=>Array.from({length:15},(_,x)=>y===0&&x===0?'🟢':y===1&&x===1?'🍎':'⬛').join('')).join('\n')
 const png=await renderBoard(board)
 assert.equal(png.subarray(1,4).toString(),'PNG');assert.equal(png.readUInt32BE(16),480);assert.equal(png.readUInt32BE(20),320)
})
test('invalid grids and remote/custom tokens cannot become file or network paths',async()=>{
 await assert.rejects(renderBoard('✅✅\n✅'),/INVALID_BOARD/)
 await assert.rejects(renderBoard('X'),/UNSUPPORTED_BOARD_TOKEN/)
 await assert.rejects(renderBoard('✅',{cellSize:1000}),/INVALID_BOARD/)
})
