async function run() {
  const req = await fetch('https://rest.testnet.initia.xyz/initia/move/v1/accounts/init1g329dvgxpqf6c6umly9q8g6643v3ecf3c8nqty/modules/brawlers/view_functions/get_stable', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type_args: [], args: ["init1vnhz29m8l4d9g5n9hszxftujsqckkfrnl3fu7m"] })
  });
  console.log(req.status, await req.text());
}
run();
