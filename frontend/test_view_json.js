const { LCDClient } = require('@initia/initia.js');
const lcd = new LCDClient({
  LCD_URL: 'https://rest.testnet.initia.xyz',
  CHAIN_ID: 'initation-1'
});

const contract = 'init1g329dvgxpqf6c6umly9q8g6643v3ecf3c8nqty';
const owner = 'init1vnhz29m8l4d9g5n9hszxftujsqckkfrnl3fu7m';

async function test(label, args) {
  try {
    const res = await lcd.move.viewJSON(contract, 'brawlers', 'get_stable', [], args);
    console.log(label, 'SUCCESS:', JSON.stringify(res));
  } catch (e) {
    console.log(label, 'FAILED:', e.message, e.response?.data);
  }
}

async function run() {
  await test('Plain Address', [owner]);
  await test('Quoted Address', [`"${owner}"`]);
  const { bcs } = require('@initia/initia.js');
  const hex = "0x" + bcs.address().serialize(owner).toHex();
  await test('Plain Hex', [hex]);
  await test('Quoted Hex', [`"${hex}"`]);
}

run();
