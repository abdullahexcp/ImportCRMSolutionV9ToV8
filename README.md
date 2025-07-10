# CRM XML Processor

Tool to downgrade CRM Dynamics XML solutions from v9 to v8 by removing incompatible elements and attributes.

## Quick Start

```bash
# Install
npm install

# Run
node crm-xml-processor.js config.json data/customizations.xml
```

## Files

- `crm-xml-processor.js` - Main tool
- `config.json` - Modification rules
- `customizations.xml` - Your CRM file to process

## What it does

- ✓ Auto backup with timestamp
- ✓ Remove specified XML elements
- ✓ Remove attributes from tags
- ✓ Add ObjectTypeCode placeholders
- ✓ Progress feedback

**Note:** After processing, you'll need to manually replace the ObjectTypeCode placeholders with actual code values for your target CRM system.

## Config Example

```json
{
  "removeElements": ["IsDataSourceSecret", "SavedQuery"],
  "removeAttributes": [
    {
      "tagName": "option",
      "attributes": ["ExternalValue", "Color"]
    }
  ],
  "addObjectTypeCode": true
}
```

Edit `config.json` to customize what gets modified.