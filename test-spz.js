const fs = require('fs');
const createSpzModule = require('@adobe/spz').default;

async function test() {
  const spz = await createSpzModule();
  const fileBytes = fs.readFileSync('public/room.spz');
  const cloud = spz.loadSpzFromBuffer(new Uint8Array(fileBytes), { to: spz.CoordinateSystem.UNSPECIFIED });
  console.log('Points:', cloud.numPoints, 'SH:', cloud.shDegree);
  
  // Try saving as v3
  const v3Bytes = spz.saveSpzToBuffer(cloud, { version: 3, from: spz.CoordinateSystem.UNSPECIFIED, sh1Bits: 5, shRestBits: 4 });
  console.log('Saved v3 size:', v3Bytes.length);
}
test().catch(console.error);
