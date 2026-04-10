const getEnvVar = (key: string): string => (process.env[key] || '') as string;

export function getDonationsModulesTreasuryL1Address(): string {
  return (
    getEnvVar('NEXT_PUBLIC_DONATIONS_MODULES_TREASURY_L1') ||
    getEnvVar('NEXT_PUBLIC_DONATIONS_TREASURY_L1') ||
    getEnvVar('NEXT_PUBLIC_CHRONICLES_VAULT_TREASURY_L1') ||
    ''
  ).trim();
}

