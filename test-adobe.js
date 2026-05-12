const fs = require('fs');
const createSpzModule = require('@adobe/spz');

async function test() {
  const spz = await createSpzModule.default();
  console.log('SPZ loaded');
}
test().catch(console.error);
