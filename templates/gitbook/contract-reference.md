# {{CONTRACT_NAME}} Contract Reference

Complete API reference for the {{CONTRACT_NAME}} smart contract.

---

## Contract Information

**Contract Name**: {{CONTRACT_NAME}}  
**Contract Address**: `{{CONTRACT_ADDRESS}}`  
**Network**: {{NETWORK}} (Chain ID: {{CHAIN_ID}})

{{#DESCRIPTION}}
**Description**: {{DESCRIPTION}}
{{/DESCRIPTION}}

---

## Functions

{{#FUNCTIONS}}
### `{{FUNCTION_NAME}}`

{{FUNCTION_DESCRIPTION}}

**Signature**:
```solidity
{{FUNCTION_SIGNATURE}}
```

**Parameters**:
{{#PARAMETERS}}
- `{{PARAM_NAME}}` ({{PARAM_TYPE}}): {{PARAM_DESCRIPTION}}
{{/PARAMETERS}}

**Returns**:
{{#RETURNS}}
- `{{RETURN_NAME}}` ({{RETURN_TYPE}}): {{RETURN_DESCRIPTION}}
{{/RETURNS}}

**State Mutability**: {{STATE_MUTABILITY}}  
**Access Control**: {{ACCESS_CONTROL}}

{{#EXAMPLE}}
**Example**:
```solidity
{{EXAMPLE}}
```
{{/EXAMPLE}}

---

{{/FUNCTIONS}}

## Events

{{#EVENTS}}
### `{{EVENT_NAME}}`

{{EVENT_DESCRIPTION}}

**Signature**:
```solidity
event {{EVENT_NAME}}({{EVENT_PARAMS}});
```

**Parameters**:
{{#EVENT_PARAMETERS}}
- `{{PARAM_NAME}}` ({{PARAM_TYPE}}, {{INDEXED}}): {{PARAM_DESCRIPTION}}
{{/EVENT_PARAMETERS}}

---

{{/EVENTS}}

## State Variables

{{#STATE_VARIABLES}}
### `{{VARIABLE_NAME}}`

**Type**: {{VARIABLE_TYPE}}  
**Visibility**: {{VISIBILITY}}  
**Description**: {{VARIABLE_DESCRIPTION}}

---

{{/STATE_VARIABLES}}

## ABI

```json
{{ABI_JSON}}
```

---

## Integration

See the [Integration Guide](./integration/{{CONTRACT_SLUG}}.md) for examples on how to integrate this contract into your dApp.

---

*Last updated: {{LAST_UPDATED}}*

