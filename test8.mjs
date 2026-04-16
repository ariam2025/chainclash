import fs from 'fs';
async function main() {
  const address = "init1vnhz29m8l4d9g5n9hszxftujsqckkfrnl3fu7m";
  
  // The correct BCS encoding is usually handled by initia SDK for move view functions via its REST APIs.
  // Actually, we can just hit the API with raw address instead of BCS encoding if we pass strings?
  // No, we found that gives base64 error. So we WILL pass the base64 encoded one but let's test BOTH and write the result.
  import * as initiaJS from '@initia/initia.js';
  const bcs = initiaJS.bcs;
  const serializedAddress = bcs.address().serialize(address).toBase64();
  
  const payload1 = JSON.stringify({
    type_args: [],
    args: [address]
  });

  const payload2 = JSON.stringify({
    type_args: [],
    args: [serializedAddress]
  });

  let r1, r2;
  try {
    const res1 = await fetch("https://rest.testnet.initia.xyz/initia/move/v1/accounts/init1g329dvgxpqf6c6umly9q8g6643v3ecf3c8nqty/modules/brawlers/view_functions/get_stable", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: payload1
    });
    r1 = await res1.text();
  } catch(e) { r1 = e.toString() }

  try {
    const res2 = await fetch("https://rest.testnet.initia.xyz/initia/move/v1/accounts/init1g329dvgxpqf6c6umly9q8g6643v3ecf3c8nqty/modules/brawlers/view_functions/get_stable", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: payload2
    });
    r2 = await res2.text();
  } catch(e) { r2 = e.toString() }

  fs.writeFileSync("/tmp/results.txt", `RAW ADDRESS RESPONSE: ${r1}\nBCS ENCODED RESPONSE: ${r2}\n`);
}
main().catch(e => fs.writeFileSync("/tmp/results.txt", "ERROR: " + e.stack));
