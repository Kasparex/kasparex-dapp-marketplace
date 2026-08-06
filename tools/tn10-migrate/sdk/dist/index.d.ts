export type PatternPhase = 'core' | 'krc20' | 'zk-aware';
export type PatternStatus = 'planned' | 'scaffolded' | 'implemented' | 'audited';
export type PatternAuditStatus = 'none' | 'internal-regression-gated' | 'external-audit-pending' | 'externally-audited';
export interface PatternVerification {
    compileValidated: boolean;
    runtimeValidated: boolean;
    auditChecked: boolean;
    auditStatus: PatternAuditStatus;
    compileTestPath?: string;
    runtimeTestPath?: string;
}
export interface PatternCompilerSupport {
    bootstrap: 'pinned-upstream';
    bootstrapCommand: 'npm run bootstrap:silverc' | 'npm run patch:silverc:zk';
    defaultMode: 'ast-only' | 'compile';
    requiresPatchedSilverc: boolean;
}
export interface PatternManifestEntry {
    id: string;
    title: string;
    phase: PatternPhase;
    stateful: boolean;
    status: PatternStatus;
    summary: string;
    contractPath?: string;
    docPath?: string;
    tags: string[];
    verification: PatternVerification;
    compiler: PatternCompilerSupport;
}
export declare const patternManifest: PatternManifestEntry[];
export declare function listPatterns(): PatternManifestEntry[];
export declare function listPatternsByPhase(phase: PatternPhase): PatternManifestEntry[];
export declare function getPatternById(id: string): PatternManifestEntry | undefined;
export interface PatternCompilePlan {
    pattern: PatternManifestEntry;
    spec: SilvercCompileSpec;
    bootstrapCommand: PatternCompilerSupport['bootstrapCommand'];
}
export declare function buildPatternCompilePlan(id: string, constructorArgs?: Array<string | number | boolean>, options?: {
    silvercBinary?: string;
    mode?: 'ast-only' | 'compile';
}): PatternCompilePlan;
export interface PatternDeployPlan {
    patternId: string;
    patternTitle: string;
    phase: PatternPhase;
    stateful: boolean;
    status: PatternStatus;
    constructorArgs: Array<string | number | boolean>;
    compiled: {
        contractName?: string;
        compilerVersion?: string;
        scriptHex: string;
        scriptLength: number;
    };
    p2shCommitment: {
        scheme: 'p2sh';
        redeemScriptHex: string;
    };
    deployment: {
        instructions: string[];
        entrypoints: string[];
        networkHints: string[];
    };
    compiler: PatternCompilerSupport;
    verification: PatternVerification;
    docPath?: string;
    contractPath?: string;
}
export interface BuildDeployPlanOptions {
    silvercBinary?: string;
    repoRoot?: string;
    network?: 'kaspa:testnet-12' | 'kaspa:testnet-11' | 'kaspa:mainnet';
}
export declare function buildPatternDeployPlan(id: string, constructorArgs: Array<string | number | boolean>, options?: BuildDeployPlanOptions): PatternDeployPlan;
export declare const KCC20_IDENTIFIER_TYPE: {
    readonly pubkey: 0;
    readonly scriptHash: 1;
    readonly covenantId: 2;
};
export type Kcc20IdentifierTypeName = keyof typeof KCC20_IDENTIFIER_TYPE;
export type Kcc20IdentifierTypeValue = (typeof KCC20_IDENTIFIER_TYPE)[Kcc20IdentifierTypeName];
export type Kcc20ControllerKind = 'ownable' | 'pausable' | 'capped' | 'vesting';
export interface Kcc20TemplateParts {
    prefixLength: number;
    suffixLength: number;
    expectedTemplateHash: string;
    templatePrefix: string;
    templateSuffix: string;
}
export interface Kcc20AssetConfig {
    ownerIdentifier: string;
    amount: number;
    identifierType: Kcc20IdentifierTypeValue;
    isMinter: boolean;
    maxCovenantInputs: number;
    maxCovenantOutputs: number;
}
export interface Kcc20AssetState extends Pick<Kcc20AssetConfig, 'ownerIdentifier' | 'amount' | 'identifierType' | 'isMinter'> {
}
export interface Kcc20OwnableControllerConfig {
    kind: 'ownable';
    admin: string;
    hasPendingAdmin?: boolean;
    pendingAdmin?: string;
    initialized?: boolean;
}
export interface Kcc20PausableControllerConfig {
    kind: 'pausable';
    admin: string;
    paused?: boolean;
    initialized?: boolean;
}
export interface Kcc20CappedControllerConfig {
    kind: 'capped';
    admin: string;
    totalCap: number;
    remainingAllowance?: number;
    initialized?: boolean;
}
export interface Kcc20VestingControllerConfig {
    kind: 'vesting';
    admin: string;
    beneficiary: string;
    totalAllocation: number;
    mintedAmount?: number;
    cliffTime: number;
    period: number;
    releasePerPeriod: number;
    initialized?: boolean;
}
export type Kcc20ControllerConfig = Kcc20OwnableControllerConfig | Kcc20PausableControllerConfig | Kcc20CappedControllerConfig | Kcc20VestingControllerConfig;
export interface Kcc20OwnableControllerState {
    admin: string;
    hasPendingAdmin: boolean;
    pendingAdmin: string;
    kcc20Covid: string;
    initialized: boolean;
}
export interface Kcc20PausableControllerState {
    paused: boolean;
    kcc20Covid: string;
    initialized: boolean;
}
export interface Kcc20CappedControllerState {
    totalCap: number;
    remainingAllowance: number;
    kcc20Covid: string;
    initialized: boolean;
}
export interface Kcc20VestingControllerState {
    totalAllocation: number;
    mintedAmount: number;
    cliffTime: number;
    period: number;
    releasePerPeriod: number;
    kcc20Covid: string;
    initialized: boolean;
}
export type Kcc20ControllerState = Kcc20OwnableControllerState | Kcc20PausableControllerState | Kcc20CappedControllerState | Kcc20VestingControllerState;
export interface Kcc20ContractPaths {
    asset: string;
    controller: string;
    controllerDoc: string;
}
export interface Kcc20LifecycleStep {
    name: 'controller-genesis' | 'asset-genesis' | 'issuance';
    description: string;
    requires: string[];
}
export interface Kcc20LifecyclePlan {
    controllerKind: Kcc20ControllerKind;
    paths: Kcc20ContractPaths;
    controllerState: Kcc20ControllerState;
    assetState: Kcc20AssetState;
    steps: Kcc20LifecycleStep[];
}
export interface Kcc20TransactionInputPlan {
    role: 'funding' | 'controller' | 'asset';
    covenantBound: boolean;
    description: string;
}
export interface Kcc20TransactionOutputPlan {
    role: 'controller' | 'asset-minter' | 'asset-recipient';
    covenantBound: boolean;
    amountSource: 'fixed-zero' | 'caller-specified' | 'minted-amount';
    description: string;
}
export interface Kcc20TransactionPlan {
    kind: 'controller-genesis' | 'asset-genesis' | 'mint';
    contractPath: string;
    entrypoint?: string;
    inputs: Kcc20TransactionInputPlan[];
    outputs: Kcc20TransactionOutputPlan[];
    requiredSigners: string[];
    notes: string[];
}
export interface Kcc20LifecycleTransactionPlans {
    controllerGenesis: Kcc20TransactionPlan;
    assetGenesis: Kcc20TransactionPlan;
    mint: Kcc20TransactionPlan;
}
export interface SilvercCompileSpec {
    binary: string;
    contractPath: string;
    constructorArgs: Array<string | number | boolean>;
    mode: 'ast-only' | 'compile';
}
export interface SilvercCommandPlan {
    binary: string;
    args: string[];
    constructorArgsPath?: string;
    outputPath?: string;
}
export interface SilvercRunResult<TArtifact = unknown> {
    spec: SilvercCompileSpec;
    command: SilvercCommandPlan;
    artifact: TArtifact;
}
export interface Kcc20DeploymentBundle {
    controllerPreInit: SilvercCompileSpec;
    assetGenesis: SilvercCompileSpec;
    controllerInitialized: SilvercCompileSpec;
}
export interface Kcc20MintCompileBundle {
    continuedAsset: SilvercCompileSpec;
    recipientAsset: SilvercCompileSpec;
    nextController: SilvercCompileSpec;
}
export interface Kcc20CompiledStage<TArtifact = unknown> {
    transaction: Kcc20TransactionPlan;
    compileSpec: SilvercCompileSpec;
    compiled: SilvercRunResult<TArtifact>;
}
export interface Kcc20DeployFlow<TArtifact = unknown> {
    lifecycle: Kcc20LifecyclePlan;
    transactions: Kcc20LifecycleTransactionPlans;
    deploymentBundle: Kcc20DeploymentBundle;
    stages: {
        controllerGenesis: Kcc20CompiledStage<TArtifact>;
        assetGenesis: Kcc20CompiledStage<TArtifact>;
        controllerInitialized: Kcc20CompiledStage<TArtifact>;
    };
}
export interface Kcc20AssemblyInputRef {
    role: 'funding' | 'controller' | 'asset';
    source: string;
    amount?: number;
    covenantId?: string;
}
export interface Kcc20AssemblyOutputRef {
    role: 'controller' | 'asset-minter' | 'asset-recipient';
    amount: number | '<caller-specified>' | '<minted-amount>';
    owner: string;
    covenantBound: boolean;
}
export interface Kcc20TransactionAssembly<TArtifact = unknown> {
    stage: 'controllerGenesis' | 'assetGenesis' | 'controllerInitialized';
    entrypoint?: string;
    requiredSigners: string[];
    inputs: Kcc20AssemblyInputRef[];
    outputs: Kcc20AssemblyOutputRef[];
    compiled: SilvercRunResult<TArtifact>;
    notes: string[];
}
export interface Kcc20BroadcastReadyFlow<TArtifact = unknown> {
    controllerKind: Kcc20ControllerKind;
    assemblies: {
        controllerGenesis: Kcc20TransactionAssembly<TArtifact>;
        assetGenesis: Kcc20TransactionAssembly<TArtifact>;
        controllerInitialized: Kcc20TransactionAssembly<TArtifact>;
    };
}
export declare function getKcc20ControllerPaths(kind: Kcc20ControllerKind): Kcc20ContractPaths;
export declare function buildKcc20AssetConfig(config: Kcc20AssetConfig): Kcc20AssetConfig;
export declare function buildKcc20AssetConstructorArgs(config: Kcc20AssetConfig): Array<string | number | boolean>;
export declare function buildKcc20ControllerState(config: Kcc20ControllerConfig, kcc20Covid: string): Kcc20ControllerState;
export declare function buildKcc20ControllerConstructorArgs(config: Kcc20ControllerConfig, kcc20Covid: string, template: Kcc20TemplateParts): Array<string | number | boolean>;
export declare function buildKcc20LifecyclePlan(controller: Kcc20ControllerConfig, template: Kcc20TemplateParts, options?: {
    placeholderKcc20Covid?: string;
    maxCovenantInputs?: number;
    maxCovenantOutputs?: number;
}): Kcc20LifecyclePlan;
export declare function buildKcc20LifecycleTransactionPlans(controller: Kcc20ControllerConfig, template: Kcc20TemplateParts, options?: {
    placeholderKcc20Covid?: string;
    maxCovenantInputs?: number;
    maxCovenantOutputs?: number;
}): Kcc20LifecycleTransactionPlans;
export declare function buildSilvercCompileSpec(contractPath: string, constructorArgs: Array<string | number | boolean>, options?: {
    silvercBinary?: string;
    mode?: 'ast-only' | 'compile';
}): SilvercCompileSpec;
export declare function buildSilvercCommandPlan(spec: SilvercCompileSpec, options?: {
    repoRoot?: string;
    constructorArgsPath?: string;
    outputPath?: string;
    stdout?: boolean;
}): SilvercCommandPlan;
export declare function runSilvercCompileSpec<TArtifact = unknown>(spec: SilvercCompileSpec, options?: {
    repoRoot?: string;
    keepTempDir?: boolean;
}): SilvercRunResult<TArtifact>;
export declare function buildKcc20DeploymentBundle(controller: Kcc20ControllerConfig, template: Kcc20TemplateParts, options?: {
    placeholderKcc20Covid?: string;
    maxCovenantInputs?: number;
    maxCovenantOutputs?: number;
    silvercBinary?: string;
    mode?: 'ast-only' | 'compile';
    controllerCovenantIdPlaceholder?: string;
    assetCovenantIdPlaceholder?: string;
}): Kcc20DeploymentBundle;
export declare function buildKcc20MintCompileBundle(controller: Kcc20ControllerConfig, template: Kcc20TemplateParts, params: {
    assetCovenantId: string;
    controllerCovenantId: string;
    recipientIdentifier: string;
    recipientAmount: number;
    nextController: Kcc20ControllerConfig;
    continuedAssetAmount?: number;
    maxCovenantInputs?: number;
    maxCovenantOutputs?: number;
    silvercBinary?: string;
    mode?: 'ast-only' | 'compile';
}): Kcc20MintCompileBundle;
export declare function compileKcc20DeploymentBundle<TArtifact = unknown>(bundle: Kcc20DeploymentBundle, options?: {
    repoRoot?: string;
    keepTempDir?: boolean;
}): {
    controllerPreInit: SilvercRunResult<TArtifact>;
    assetGenesis: SilvercRunResult<TArtifact>;
    controllerInitialized: SilvercRunResult<TArtifact>;
};
export declare function buildKcc20DeployFlow<TArtifact = unknown>(controller: Kcc20ControllerConfig, template: Kcc20TemplateParts, options?: {
    repoRoot?: string;
    keepTempDir?: boolean;
    placeholderKcc20Covid?: string;
    maxCovenantInputs?: number;
    maxCovenantOutputs?: number;
    silvercBinary?: string;
    mode?: 'ast-only' | 'compile';
    controllerCovenantIdPlaceholder?: string;
    assetCovenantIdPlaceholder?: string;
}): Kcc20DeployFlow<TArtifact>;
export declare function buildKcc20BroadcastReadyFlow<TArtifact = unknown>(flow: Kcc20DeployFlow<TArtifact>, options?: {
    controllerFundingSource?: string;
    controllerFundingAmount?: number;
    controllerOutpointRef?: string;
    assetOutpointRef?: string;
    controllerCovenantId?: string;
    assetCovenantId?: string;
    recipientOwner?: string;
}): Kcc20BroadcastReadyFlow<TArtifact>;
export declare function getDefaultSilvercBinary(): string;
export declare function getKcc20AssetDocPath(): string;
export type SilvercExprJson = {
    kind: 'int';
    data: number;
} | {
    kind: 'bool';
    data: boolean;
} | {
    kind: 'byte';
    data: number;
} | {
    kind: 'array';
    data: SilvercExprJson[];
};
export declare function encodeConstructorArgForSilverc(value: string | number | boolean): SilvercExprJson;
export declare function encodeConstructorArgsForSilverc(args: Array<string | number | boolean>): SilvercExprJson[];
export interface CompiledScriptArtifact {
    contract_name?: string;
    compiler_version?: string;
    script: number[];
}
export declare function extractCompiledScript(artifact: unknown): Uint8Array;
export interface CovenantScriptPublicKeyShape {
    encoding: 'p2sh';
    redeemScript: Uint8Array;
    scriptPublicKey: Uint8Array | null;
    address: string | null;
}
export declare function describeCovenantScriptPublicKey(artifact: unknown): CovenantScriptPublicKeyShape;
export declare const OP_ZK_PRECOMPILE_GROTH16_TAG = 32;
export interface ZkStackBytesSlot {
    kind: 'bytes';
    label: string;
    bytes: Uint8Array;
}
export interface ZkStackIntSlot {
    kind: 'int';
    label: string;
    value: number;
}
export type ZkStackSlot = ZkStackBytesSlot | ZkStackIntSlot;
export interface Groth16WitnessBuildOptions {
    verifyingKey: Uint8Array;
    proof: Uint8Array;
    publicInputs: Uint8Array[];
    expectedPublicInputs?: number;
}
export interface Groth16WitnessPlan {
    precompile: 'groth16';
    tag: number;
    pushOrder: ZkStackSlot[];
    stackTopToBottom: ZkStackSlot[];
}
export declare function buildGroth16WitnessPlan(opts: Groth16WitnessBuildOptions): Groth16WitnessPlan;
//# sourceMappingURL=index.d.ts.map