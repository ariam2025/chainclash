import { bcs } from '@initia/initia.js';

const address = "init1vnhz29m8l4d9g5n9hszxftujsqckkfrnl3fu7m";
const serializedArgs = bcs.address().serialize(address).toBase64();

async function main() {
  const payload = JSON.stringify({
    type_args: [],
    args: [serializedArgs]
  });

  const r = await fetch("https://rest.testnet.initia.xyz/initia/move/v1/accounts/init1g329dvgxpqf6c6umly9q8g6643v3ecf3c8nqty/modules/brawlers/view_functions/get_stable", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload
  });
  
  const text = await r.text();
  console.log("RESPONSE HTTP CODE:", r.status);
  console.log("RESPONSE:", text);
}
main();
