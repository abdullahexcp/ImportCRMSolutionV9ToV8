#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { DOMParser, XMLSerializer } = require('xmldom');

class CRMXMLProcessor {
    constructor(configPath) {
        this.config = this.loadConfig(configPath);
        this.parser = new DOMParser();
        this.serializer = new XMLSerializer();
    }

    loadConfig(configPath) {
        try {
            const configContent = fs.readFileSync(configPath, 'utf8');
            return JSON.parse(configContent);
        } catch (error) {
            console.error(`Error loading config file: ${error.message}`);
            process.exit(1);
        }
    }

    createBackup(filePath) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = `${filePath}.backup.${timestamp}`;
        fs.copyFileSync(filePath, backupPath);
        console.log(`✓ Backup created: ${backupPath}`);
        return backupPath;
    }

    removeElements(doc, tagNames) {
        tagNames.forEach(tagName => {
            const elements = doc.getElementsByTagName(tagName);
            // Convert to array to avoid live NodeList issues
            const elementsArray = Array.from(elements);
            
            elementsArray.forEach(element => {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            });
            
            if (elementsArray.length > 0) {
                console.log(`✓ Removed ${elementsArray.length} <${tagName}> elements`);
            }
        });
    }

    removeAttributes(doc, tagName, attributes) {
        const elements = doc.getElementsByTagName(tagName);
        let removedCount = 0;

        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            attributes.forEach(attr => {
                if (element.hasAttribute(attr)) {
                    element.removeAttribute(attr);
                    removedCount++;
                }
            });
        }

        if (removedCount > 0) {
            console.log(`✓ Removed ${removedCount} attributes from <${tagName}> elements`);
        }
    }

    addObjectTypeCode(doc) {
        const entities = doc.getElementsByTagName('Entity');
        let addedCount = 0;

        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            
            // Check if ObjectTypeCode already exists
            const existingCode = entity.getElementsByTagName('ObjectTypeCode');
            if (existingCode.length === 0) {
                const objectTypeCode = doc.createElement('ObjectTypeCode');
                objectTypeCode.textContent = '##';
                
                // Add as first child of Entity
                if (entity.firstChild) {
                    entity.insertBefore(objectTypeCode, entity.firstChild);
                } else {
                    entity.appendChild(objectTypeCode);
                }
                addedCount++;
            }
        }

        if (addedCount > 0) {
            console.log(`✓ Added ${addedCount} <ObjectTypeCode> elements`);
        }
    }

    processFile(filePath) {
        try {
            console.log(`Processing: ${filePath}`);
            
            // Create backup
            this.createBackup(filePath);
            
            // Read and parse XML
            const xmlContent = fs.readFileSync(filePath, 'utf8');
            const doc = this.parser.parseFromString(xmlContent, 'text/xml');
            
            // Check for parsing errors
            const parseErrors = doc.getElementsByTagName('parsererror');
            if (parseErrors.length > 0) {
                throw new Error('XML parsing failed');
            }

            // Apply transformations based on config
            if (this.config.removeElements && this.config.removeElements.length > 0) {
                console.log('Removing elements...');
                this.removeElements(doc, this.config.removeElements);
            }

            if (this.config.removeAttributes) {
                this.config.removeAttributes.forEach(rule => {
                    console.log(`Removing attributes from <${rule.tagName}>...`);
                    this.removeAttributes(doc, rule.tagName, rule.attributes);
                });
            }

            if (this.config.addObjectTypeCode) {
                console.log('Adding ObjectTypeCode elements...');
                this.addObjectTypeCode(doc);
            }

            // Serialize and save
            const updatedXml = this.serializer.serializeToString(doc);
            fs.writeFileSync(filePath, updatedXml, 'utf8');
            
            console.log(`✓ Successfully processed ${filePath}`);
            
        } catch (error) {
            console.error(`Error processing file: ${error.message}`);
            process.exit(1);
        }
    }
}

// Main execution
function main() {
    const args = process.argv.slice(2);
    
    if (args.length !== 2) {
        console.log('Usage: node crm-xml-processor.js <config.json> <customizations.xml>');
        console.log('Example: node crm-xml-processor.js config.json customizations.xml');
        process.exit(1);
    }

    const [configPath, xmlPath] = args;
    
    // Validate files exist
    if (!fs.existsSync(configPath)) {
        console.error(`Config file not found: ${configPath}`);
        process.exit(1);
    }
    
    if (!fs.existsSync(xmlPath)) {
        console.error(`XML file not found: ${xmlPath}`);
        process.exit(1);
    }

    const processor = new CRMXMLProcessor(configPath);
    processor.processFile(xmlPath);
}

if (require.main === module) {
    main();
}