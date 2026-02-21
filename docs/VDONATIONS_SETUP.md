# Kasparex vDonations — Post-deploy setup

After deploying DonationEscrow (see `scripts/deploy-donation-escrow.js`), complete these steps so L2 donations and L1 recording work correctly.

## 1. FeeRouter

Register DonationEscrow as an authorized dApp so it can forward fees and trigger rewards:

- **Contract:** FeeRouter (same network as DonationEscrow, e.g. IGRA Galleon Testnet)
- **Call:** `setAuthorizedDApp(DonationEscrowAddress, true)` (as FeeRouter owner)
- Optionally configure base reward for the action type `"donation"` (e.g. `setBaseReward("donation", ...)` if your FeeRouter supports it)

## 2. LoyaltyPoints

Allow DonationEscrow to award points (for L1-recorded donations and optionally for L2 donations if your flow uses it):

- **Contract:** LoyaltyPoints (same network)
- **Call:** `setAuthorizedCaller(DonationEscrowAddress, true)` (as LoyaltyPoints owner)
- Optionally set points per 1 iKAS for the action type `"vdonation-l1"` (or whatever your contract uses for L1 donations)

## 3. Environment

- **Frontend:** Set `NEXT_PUBLIC_DONATION_ESCROW_ADDRESS_38836` (or `NEXT_PUBLIC_DONATION_ESCROW_ADDRESS_IGRA_GALLEON_TESTNET`) to the deployed DonationEscrow address.
- **L1 record API:** Set `VDONATIONS_RECORDER_PRIVATE_KEY` to the private key of the wallet that will call `recordL1Donation` (must match the `recorder` set at deploy).
- **Optional:** `KASPA_TX_API_URL` for Kaspa tx verification (defaults to public API). `NEXT_PUBLIC_VDONATIONS_PLATFORM_L1_ADDRESS` for the platform L1 fee address.

## Navigation

vDonations is linked from the Hub (Kasparex vDonations) and from the header section title when on `/donations`. Listing: `/donations`, campaign: `/donations/[creatorAddress]`, studio: `/donations/studio`.
