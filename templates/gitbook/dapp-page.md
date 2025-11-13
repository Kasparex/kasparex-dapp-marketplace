# {{DAPP_NAME}}

{{DAPP_DESCRIPTION}}

---

## Overview

**Status**: {{STATUS}}  
**Version**: {{VERSION}}  
**Category**: {{CATEGORY}}  
**Network**: {{NETWORK}}  
**Developer**: {{DEVELOPER}}

{{#DEVELOPER_LINKS}}
**Developer Links**:
{{#each DEVELOPER_LINKS}}
- [{{label}}]({{url}})
{{/each}}
{{/DEVELOPER_LINKS}}

---

## What is {{DAPP_NAME}}?

{{UTILITY}}

## How It Works

{{PROCESS}}

## Benefits

{{BENEFITS}}

---

## Contract Information

**Contract Address**: `{{CONTRACT_ADDRESS}}`  
**Deployer Address**: `{{DEPLOYER_ADDRESS}}`  
**dApp ID**: {{DAPP_ID}}

### Network Support

{{#NETWORKS}}
- **{{NETWORK_NAME}}**: `{{CONTRACT_ADDRESS}}` (Chain ID: {{CHAIN_ID}})
{{/NETWORKS}}

---

## Features

{{#FEATURES}}
- {{FEATURE}}
{{/FEATURES}}

---

## Usage

{{#USAGE_EXAMPLES}}
### {{EXAMPLE_TITLE}}

```typescript
{{EXAMPLE_CODE}}
```

{{/USAGE_EXAMPLES}}

---

## Security

{{SECURITY}}

---

## Roadmap

{{ROADMAP}}

---

## Related Documentation

- [Contract Reference](./contracts/{{CONTRACT_SLUG}}.md)
- [Integration Guide](./integration/{{DAPP_SLUG}}.md)

---

*Last updated: {{LAST_UPDATED}}*

