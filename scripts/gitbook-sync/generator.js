/**
 * Documentation Generator
 * 
 * Generates markdown documentation from templates and dApp data
 */

const fs = require('fs');
const path = require('path');

class DocumentationGenerator {
  constructor() {
    this.templates = {
      dappPage: null,
      contractReference: null,
      integrationGuide: null,
    };
    this.loadTemplates();
  }

  /**
   * Load markdown templates
   */
  loadTemplates() {
    const templatesDir = path.join(__dirname, '../../templates/gitbook');
    
    try {
      this.templates.dappPage = fs.readFileSync(
        path.join(templatesDir, 'dapp-page.md'),
        'utf-8'
      );
      this.templates.contractReference = fs.readFileSync(
        path.join(templatesDir, 'contract-reference.md'),
        'utf-8'
      );
      this.templates.integrationGuide = fs.readFileSync(
        path.join(templatesDir, 'integration-guide.md'),
        'utf-8'
      );
    } catch (error) {
      console.error('Error loading templates:', error.message);
    }
  }

  /**
   * Simple template engine - replace placeholders
   */
  renderTemplate(template, data) {
    let result = template;

    // Replace simple placeholders {{KEY}}
    Object.keys(data).forEach((key) => {
      const value = data[key];
      const placeholder = `{{${key}}}`;
      
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        result = result.replace(new RegExp(placeholder, 'g'), String(value));
      } else if (Array.isArray(value)) {
        // Handle array templates {{#ARRAY}}...{{/ARRAY}}
        const arrayRegex = new RegExp(
          `{{#${key}}}([\\s\\S]*?){{/${key}}}`,
          'g'
        );
        result = result.replace(arrayRegex, (match, content) => {
          return value.map((item) => {
            let itemContent = content;
            if (typeof item === 'object') {
              Object.keys(item).forEach((itemKey) => {
                itemContent = itemContent.replace(
                  new RegExp(`{{${itemKey}}}`, 'g'),
                  String(item[itemKey] || '')
                );
              });
            } else {
              itemContent = itemContent.replace(/{{.*?}}/g, String(item));
            }
            return itemContent;
          }).join('\n');
        });
      }
    });

    // Remove unmatched conditionals
    result = result.replace(/{{#[\w]+}}[\s\S]*?{{\/[\w]+}}/g, '');
    
    // Remove any remaining placeholders
    result = result.replace(/{{[\w#\/]+}}/g, '');

    return result;
  }

  /**
   * Generate dApp page documentation
   */
  generateDAppPage(dAppData) {
    const data = {
      DAPP_NAME: dAppData.name,
      DAPP_DESCRIPTION: dAppData.description || `${dAppData.name} - ${dAppData.utility}`,
      STATUS: dAppData.status || 'Testnet',
      VERSION: dAppData.version || '1.0',
      CATEGORY: dAppData.category || 'general',
      NETWORK: dAppData.network || 'Testnet',
      DEVELOPER: dAppData.developer || 'Kasparex',
      DEVELOPER_LINKS: dAppData.developerLinks || [],
      UTILITY: dAppData.utility || 'No utility description available.',
      PROCESS: dAppData.process || 'No process description available.',
      BENEFITS: dAppData.benefits || 'No benefits listed.',
      CONTRACT_ADDRESS: dAppData.contractAddress || '',
      DEPLOYER_ADDRESS: dAppData.deployer || '',
      DAPP_ID: dAppData.id || '',
      NETWORKS: dAppData.contractAddress ? [
        {
          NETWORK_NAME: dAppData.network || 'Testnet',
          CONTRACT_ADDRESS: dAppData.contractAddress,
          CHAIN_ID: dAppData.network === 'Mainnet' ? '202555' : '167012',
        },
      ] : [],
      FEATURES: dAppData.features || [],
      USAGE_EXAMPLES: dAppData.usageExamples || [],
      SECURITY: dAppData.security || 'Security information not available.',
      ROADMAP: dAppData.roadmap || 'Roadmap information not available.',
      CONTRACT_SLUG: this.slugify(dAppData.name),
      DAPP_SLUG: this.slugify(dAppData.name),
      LAST_UPDATED: new Date().toISOString().split('T')[0],
    };

    return this.renderTemplate(this.templates.dappPage, data);
  }

  /**
   * Generate contract reference documentation
   */
  generateContractReference(contractData) {
    const functions = this.extractFunctions(contractData.abi);
    const events = this.extractEvents(contractData.abi);
    const stateVariables = this.extractStateVariables(contractData.abi);

    const data = {
      CONTRACT_NAME: contractData.name,
      CONTRACT_ADDRESS: contractData.address,
      NETWORK: contractData.networkName || 'Kasplex L2 Testnet',
      CHAIN_ID: contractData.networkName === 'kasplexL2Mainnet' ? '202555' : '167012',
      DESCRIPTION: contractData.description || `Smart contract for ${contractData.name}`,
      FUNCTIONS: functions,
      EVENTS: events,
      STATE_VARIABLES: stateVariables,
      ABI_JSON: JSON.stringify(contractData.abi, null, 2),
      CONTRACT_SLUG: this.slugify(contractData.name),
      LAST_UPDATED: new Date().toISOString().split('T')[0],
    };

    return this.renderTemplate(this.templates.contractReference, data);
  }

  /**
   * Generate integration guide documentation
   */
  generateIntegrationGuide(dAppData, contractData) {
    const readFunction = this.findReadFunction(contractData.abi);
    const writeFunction = this.findWriteFunction(contractData.abi);

    const data = {
      DAPP_NAME: dAppData.name,
      NETWORK: dAppData.networkName || 'Kasplex L2 Testnet',
      NETWORK_NAME: this.formatNetworkName(dAppData.networkName),
      CONTRACT_ADDRESS: contractData.address || dAppData.contractAddress,
      CONTRACT_ABI_NAME: `${contractData.name.toUpperCase().replace(/\s+/g, '_')}_ABI`,
      EXAMPLE_READ_FUNCTION: readFunction?.name || 'getData',
      EXAMPLE_WRITE_FUNCTION: writeFunction?.name || 'setData',
      HOOK_NAME: dAppData.name.replace(/\s+/g, ''),
      READ_DATA: 'data',
      READ_FUNCTION: readFunction?.name || 'getData',
      WRITE_FUNCTION: this.camelCase(writeFunction?.name || 'setData'),
      WRITE_FUNCTION_NAME: writeFunction?.name || 'setData',
      PARAMS: writeFunction?.inputs?.map((input, i) => `${input.name || `param${i}`}: ${this.formatType(input.type)}`).join(', ') || '',
      ARGS: writeFunction?.inputs?.map((input, i) => input.name || `param${i}`).join(', ') || '',
      NETWORKS: [
        {
          NETWORK_NAME: this.formatNetworkName(dAppData.networkName),
          CHAIN_ID: dAppData.networkName === 'kasplexL2Mainnet' ? '202555' : '167012',
          CONTRACT_ADDRESS: contractData.address || dAppData.contractAddress,
          RPC_URL: dAppData.networkName === 'kasplexL2Mainnet' 
            ? 'https://evmrpc.kasplex.org' 
            : 'https://evmrpc-testnet.kasplex.org',
          EXPLORER_URL: dAppData.networkName === 'kasplexL2Mainnet'
            ? 'https://explorer.kasplex.org'
            : 'https://explorer-testnet.kasplex.org',
        },
      ],
      NATIVE_TOKEN: 'KAS',
      CONTRACT_SLUG: this.slugify(contractData.name),
      DAPP_SLUG: this.slugify(dAppData.name),
      LAST_UPDATED: new Date().toISOString().split('T')[0],
    };

    return this.renderTemplate(this.templates.integrationGuide, data);
  }

  /**
   * Extract functions from ABI
   */
  extractFunctions(abi) {
    if (!abi || !Array.isArray(abi)) return [];
    
    return abi
      .filter((item) => item.type === 'function')
      .map((func) => ({
        FUNCTION_NAME: func.name,
        FUNCTION_DESCRIPTION: func.name || 'No description available',
        FUNCTION_SIGNATURE: this.formatFunctionSignature(func),
        PARAMETERS: func.inputs?.map((input, i) => ({
          PARAM_NAME: input.name || `param${i}`,
          PARAM_TYPE: input.type,
          PARAM_DESCRIPTION: input.name || 'No description',
        })) || [],
        RETURNS: func.outputs?.map((output, i) => ({
          RETURN_NAME: output.name || `return${i}`,
          RETURN_TYPE: output.type,
          RETURN_DESCRIPTION: output.name || 'No description',
        })) || [],
        STATE_MUTABILITY: func.stateMutability || 'nonpayable',
        ACCESS_CONTROL: 'Public',
      }));
  }

  /**
   * Extract events from ABI
   */
  extractEvents(abi) {
    if (!abi || !Array.isArray(abi)) return [];
    
    return abi
      .filter((item) => item.type === 'event')
      .map((event) => ({
        EVENT_NAME: event.name,
        EVENT_DESCRIPTION: event.name || 'No description available',
        EVENT_PARAMS: event.inputs?.map((input) => 
          `${input.type}${input.indexed ? ' indexed' : ''} ${input.name || ''}`
        ).join(', ') || '',
        EVENT_PARAMETERS: event.inputs?.map((input, i) => ({
          PARAM_NAME: input.name || `param${i}`,
          PARAM_TYPE: input.type,
          INDEXED: input.indexed ? 'indexed' : '',
          PARAM_DESCRIPTION: input.name || 'No description',
        })) || [],
      }));
  }

  /**
   * Extract state variables from ABI (limited - ABI doesn't include all state vars)
   */
  extractStateVariables(abi) {
    // ABIs don't typically include state variables
    // This would need to be parsed from the Solidity source
    return [];
  }

  /**
   * Format function signature
   */
  formatFunctionSignature(func) {
    const params = func.inputs?.map((input) => `${input.type} ${input.name || ''}`).join(', ') || '';
    const returns = func.outputs?.length > 0 
      ? ` returns (${func.outputs.map((output) => output.type).join(', ')})`
      : '';
    return `function ${func.name}(${params})${returns}`;
  }

  /**
   * Find a read function from ABI
   */
  findReadFunction(abi) {
    if (!abi || !Array.isArray(abi)) return null;
    
    const readFuncs = abi.filter(
      (item) => item.type === 'function' && 
      (item.stateMutability === 'view' || item.stateMutability === 'pure')
    );
    return readFuncs[0] || null;
  }

  /**
   * Find a write function from ABI
   */
  findWriteFunction(abi) {
    if (!abi || !Array.isArray(abi)) return null;
    
    const writeFuncs = abi.filter(
      (item) => item.type === 'function' && 
      item.stateMutability !== 'view' && 
      item.stateMutability !== 'pure'
    );
    return writeFuncs[0] || null;
  }

  /**
   * Format type for TypeScript
   */
  formatType(solidityType) {
    const mapping = {
      'uint256': 'bigint',
      'uint128': 'bigint',
      'uint64': 'bigint',
      'uint32': 'number',
      'uint8': 'number',
      'address': 'string',
      'bool': 'boolean',
      'string': 'string',
      'bytes': 'string',
    };
    
    if (mapping[solidityType]) {
      return mapping[solidityType];
    }
    
    if (solidityType.startsWith('uint')) {
      return 'bigint';
    }
    
    return 'unknown';
  }

  /**
   * Convert to slug
   */
  slugify(text) {
    return String(text)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Convert to camelCase
   */
  camelCase(text) {
    return String(text)
      .replace(/\s+/g, '')
      .replace(/^[A-Z]/, (match) => match.toLowerCase());
  }

  /**
   * Format network name
   */
  formatNetworkName(networkName) {
    const mapping = {
      'kasplexL2Testnet': 'Kasplex L2 Testnet',
      'kasplexL2Mainnet': 'Kasplex L2 Mainnet',
      'igraCaravelTestnet': 'Igra Caravel Testnet',
    };
    return mapping[networkName] || networkName;
  }
}

module.exports = { DocumentationGenerator };

