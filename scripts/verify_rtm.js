const hre = require("hardhat");

async function main() {
    const [deployer, genesis1, genesis2, genesis3, genesis4, genesis5, platform, alice, bob, charlie] = await hre.ethers.getSigners();

    const genesisWallets = [genesis1.address, genesis2.address, genesis3.address, genesis4.address, genesis5.address];

    // Deploy RevenueTreeManager
    const RTM = await hre.ethers.getContractFactory("RevenueTreeManager");
    const rtm = await RTM.deploy(
        genesisWallets,
        platform.address,
        hre.ethers.constants?.AddressZero || "0x0000000000000000000000000000000000000000",
        hre.ethers.utils.parseEther("100"), // activation threshold: 100 KAS
        hre.ethers.utils.parseEther("100"), // base activity: 100 KAS
        hre.ethers.utils.parseEther("10"),  // min volume per call: 10 KAS
        hre.ethers.utils.parseEther("10")   // krex min floor: 10 KAS
    );
    await rtm.deployed();

    console.log("Deployed RTM to:", rtm.address);

    // Authorize deployer so we can call distributeToUpline
    await rtm.setAuthorizedCaller(deployer.address, true);

    // Bob sets Alice as referrer
    await rtm.connect(bob).setReferrer(alice.address);
    // Charlie sets Bob as referrer
    await rtm.connect(charlie).setReferrer(bob.address);

    // Charlie pays 100 KAS
    console.log("Charlie paying 100 KAS...");
    await rtm.distributeToUpline(charlie.address, { value: hre.ethers.utils.parseEther("100") });

    const charlieStatus = await rtm.getActivationStatus(charlie.address);
    console.log("Charlie activated:", charlieStatus[0]);

    // Charlie pays another 100 KAS
    console.log("Charlie paying another 100 KAS to cross threshold...");
    await rtm.distributeToUpline(charlie.address, { value: hre.ethers.utils.parseEther("100") });

    const charlieStatus2 = await rtm.getActivationStatus(charlie.address);
    console.log("Charlie activated now:", charlieStatus2[0]);
    console.log("Charlie Upline Snapshot:", charlieStatus2[1]);
    // Should show Bob as upline[0] (L1 = direct referrer)

    const pendingPlatform = await rtm.pendingWithdrawals(platform.address);
    console.log("Platform Pending:", hre.ethers.utils.formatEther(pendingPlatform));

    console.log("Test completed successfully!");
}

main().catch(console.error);
