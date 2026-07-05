'use client';

import { HubDocPageShell, HubStandaloneIntro } from '@/components/hub/HubDocPageShell';

export default function LegalPage() {
    return (
        <HubDocPageShell standalone>
            <HubStandaloneIntro
                title="Legal and privacy"
                count={4}
                countLabel="policy section"
                description="Last updated: February 6, 2026"
            />

                    <div className="prose prose-zinc dark:prose-invert max-w-none space-y-12">
                        <section>
                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">1. Terms of Service</h2>
                            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                By accessing Kasparex Hub, you agree to abide by our terms of service. Kasparex Hub is a decentralized dApp marketplace and utility ecosystem. Users are responsible for their own wallet security and transaction decisions.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">2. Privacy Policy</h2>
                            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                We believe in privacy by design. Kasparex Hub does not collect personal identity information. We only track on-chain wallet addresses and transaction data necessary for the loyalty program and reward calculations.
                            </p>
                            <ul className="list-disc pl-6 text-zinc-600 dark:text-zinc-400 space-y-2 mt-4">
                                <li>Your wallet address is your identity.</li>
                                <li>No email or phone number required.</li>
                                <li>Cookies are only used for site preferences.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">3. Risk Disclosure</h2>
                            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                Trading and interacting with dApps involve significant risks. Tokens in the ecosystem may be volatile. Always perform your own research (DYOR) before interacting with any third-party dApp listed on the platform.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">4. Compliance</h2>
                            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                Kasparex Hub aims to comply with all relevant regulations. Users are responsible for ensuring their use of the platform complies with their local laws and jurisdiction.
                            </p>
                        </section>
                    </div>

                    <div className="mt-16 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">Questions?</h3>
                        <p className="text-zinc-600 dark:text-zinc-400">
                            If you have any questions regarding our legal terms or privacy practices, please contact us at <a href="mailto:legal@kasparex.com" className="text-[#02abb8] hover:underline">legal@kasparex.com</a>.
                        </p>
                    </div>
        </HubDocPageShell>
    );
}
