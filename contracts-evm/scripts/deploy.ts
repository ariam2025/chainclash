import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const Brawlers = await ethers.getContractFactory("Brawlers");
  const brawlers = await Brawlers.deploy();
  await brawlers.waitForDeployment();
  const brawlersAddress = await brawlers.getAddress();
  console.log("Brawlers deployed:", brawlersAddress);

  const Battle = await ethers.getContractFactory("Battle");
  const battle = await Battle.deploy(brawlersAddress);
  await battle.waitForDeployment();
  const battleAddress = await battle.getAddress();
  console.log("Battle deployed:", battleAddress);

  const Tournament = await ethers.getContractFactory("Tournament");
  const tournament = await Tournament.deploy();
  await tournament.waitForDeployment();
  const tournamentAddress = await tournament.getAddress();
  console.log("Tournament deployed:", tournamentAddress);

  const tx = await brawlers.setBattleContract(battleAddress);
  await tx.wait();
  console.log("Linked Battle as authorized XP updater");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
