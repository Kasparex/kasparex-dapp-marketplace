# Kasparex vDonations — Post-deploy setup

After deploying DonationEscrow (see `scripts/deploy-donation-escrow.js`), do the following so L2 donations and L1 recording work.

**L2 fee:** DonationEscrow is deployed with a 10% platform fee (`feeBps = 1000`). That entire fee is sent to FeeRouter; when `setTreeBpsByType("donation", 10000)` is set, 100% of it goes to the Revenue Tree (so 10% of each L2 donation goes to the tree).

---

## Step 1: Register DonationEscrow (FeeRouter + LoyaltyPoints)

**You can run this script** (uses the same account that owns FeeRouter and LoyaltyPoints):

```bash
# From repo root. Ensure .env has PRIVATE_KEY = owner of FeeRouter & LoyaltyPoints.
# If you deployed DonationEscrow with deploy-donation-escrow.js, deployments/donation-escrow-igra-galleon-testnet.json
# will exist and the script will read DonationEscrow address from it. Otherwise set:
#   DONATION_ESCROW_ADDRESS=0xYourDeployedDonationEscrow

npx hardhat run scripts/setup-vdonations-auth.js --network igraGalleonTestnet
```

This calls:

- **FeeRouter:** `setAuthorizedDApp(DonationEscrowAddress, true)`
- **FeeRouter:** `setTreeBpsByType("donation", 10000)` — so 100% of donation fees (10% of each L2 donation) go to Revenue Tree
- **LoyaltyPoints:** `setAuthorizedCaller(DonationEscrowAddress, true)`

If you prefer to do it manually (e.g. from a block explorer), use the same three calls with your deployed DonationEscrow address. **Note:** FeeRouter must support `setTreeBpsByType` (per–transaction-type tree share); if you use an older FeeRouter, upgrade or deploy a new one.

---

## Step 2: Environment variables

Set these where the app runs (e.g. Vercel → Project → Settings → Environment Variables).

| Variable | Where | Description |
|----------|--------|-------------|
| `NEXT_PUBLIC_DONATION_ESCROW_ADDRESS_38836` | Frontend | Deployed DonationEscrow address (or use `NEXT_PUBLIC_DONATION_ESCROW_ADDRESS_IGRA_GALLEON_TESTNET`) |
| `VDONATIONS_RECORDER_PRIVATE_KEY` | Backend only | Private key of the wallet set as `recorder` when you deployed DonationEscrow (used by `POST /api/vdonations/l1/record`) |

**Optional:**

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_VDONATIONS_PLATFORM_L1_ADDRESS` | Kaspa address for L1 donation platform fees |
| `KASPA_TX_API_URL` | Kaspa API for tx verification (default: `https://api.kaspa.org`) |

See `.env.example` for the full list.

---

## Summary

1. **Run** `npx hardhat run scripts/setup-vdonations-auth.js --network igraGalleonTestnet` (with `PRIVATE_KEY` and, if needed, `DONATION_ESCROW_ADDRESS`).
2. **Set** `NEXT_PUBLIC_DONATION_ESCROW_ADDRESS_38836` and `VDONATIONS_RECORDER_PRIVATE_KEY` (and any optional vars) in Vercel (or your host).
3. Redeploy the app so it picks up the new env.

After that, vDonations is ready to use.

---

## FAQ

**Where is the deployed DonationEscrow address?**  
If you ran `deploy-donation-escrow.js` on this repo, it wrote `deployments/donation-escrow-igra-galleon-testnet.json` and the script reads the address from there. If you deployed from another machine or the file is missing, use the address from your deploy log or block explorer and set `DONATION_ESCROW_ADDRESS` when running the auth script (or set `NEXT_PUBLIC_DONATION_ESCROW_ADDRESS_38836` in Vercel).

**What is the “recorder” and where do I find its private key?**  
At deploy time, the script sets `recorder` to `RECORDER_ADDRESS` if you set that env var, otherwise to the **deployer** address. So if you didn’t set `RECORDER_ADDRESS`, the recorder is the deployer. **VDONATIONS_RECORDER_PRIVATE_KEY** should be the private key of that recorder wallet—i.e. the same key as **PRIVATE_KEY** in `.env` if you used the default (deployer as recorder).

**Can the Kaspa address for L1 platform fees be the same as the treasury address?**  
Yes. If your treasury has a Kaspa (L1) address, you can set `NEXT_PUBLIC_VDONATIONS_PLATFORM_L1_ADDRESS` to that address so L1 donation fees go to the same place.

**Existing DonationEscrow was deployed with 1% fee; how do I switch to 10%?**  
DonationEscrow owner can call `setFeeBps(1000)` on the DonationEscrow contract. Then run (or re-run) `setup-vdonations-auth.js` so FeeRouter has `setTreeBpsByType("donation", 10000)` — that sends 100% of the 10% fee to Revenue Tree.
