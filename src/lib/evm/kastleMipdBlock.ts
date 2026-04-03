import { createConnector, type CreateConnectorFn } from 'wagmi';

/**
 * Kastle announces an EIP-1193 provider for L2; wagmi MIPD would register it as a
 * generic "Installed" EVM wallet. That ties EVM to the same provider as L1 Kastle,
 * so switching Kaspa accounts changes `eth_accounts` and wagmi follows.
 *
 * Reserving Kastle's rDNS values blocks MIPD from adding those providers (wagmi skips
 * announcements whose `info.rdns` is already claimed by an explicit connector).
 *
 * If Kastle changes its announced `rdns`, add the new value here.
 * @see https://eips.ethereum.org/EIPS/eip-6963
 */
export const KASTLE_MIPD_RDNS_BLOCKLIST = [
  'cc.kastle',
  'io.kastle',
  'app.kastle',
  'com.kastle.wallet',
] as const;

function mipdRdnsReservation(rdns: string): CreateConnectorFn {
  return createConnector((wagmiConfig) => ({
    id: `mipd-reserved:${rdns}`,
    name: 'Kastle',
    rdns,
    type: 'injected' as const,
    async setup() {},
    async connect() {
      throw new Error(
        'Kastle is for Kaspa L1 here. Connect EVM with MetaMask, WalletConnect, Rainbow, or another Ethereum wallet.',
      );
    },
    async disconnect() {},
    async getAccounts() {
      return [];
    },
    async getChainId() {
      return wagmiConfig.chains[0].id;
    },
    async getProvider() {
      return undefined;
    },
    async isAuthorized() {
      return false;
    },
    onAccountsChanged() {},
    onChainChanged() {},
    onDisconnect() {},
  }));
}

/** Place before RainbowKit connectors in `createConfig({ connectors })`. */
export function createKastleMipdBlockConnectors(): CreateConnectorFn[] {
  return KASTLE_MIPD_RDNS_BLOCKLIST.map((rdns) => mipdRdnsReservation(rdns));
}
