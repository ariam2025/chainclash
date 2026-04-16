import { bcs } from '@initia/initia.js';

const targetAddress = "init1vnhz29m8l4d9g5n9hszxftujsqckkfrnl3fu7m";
const contractAddress = "init1g329dvgxpqf6c6umly9q8g6643v3ecf3c8nqty";

try {
    const hexAddress = "0x" + bcs.address().serialize(targetAddress).toHex();
    console.log("Target bech32:", targetAddress);
    console.log("Target hex:", hexAddress);
    
    const contractHex = "0x" + bcs.address().serialize(contractAddress).toHex();
    console.log("Contract bech32:", contractAddress);
    console.log("Contract hex:", contractHex);
} catch (e) {
    console.error("Error:", e);
}
