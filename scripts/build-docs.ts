#!/usr/bin/env node

/**
 * Build script to convert documentation markdown files into TypeScript exports
 * This runs at build time to embed documentation content
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const DOCS_DIR = join(__dirname, '../src/resources/docs');
const OUTPUT_FILE = join(DOCS_DIR, 'index.ts');

// Read all documentation files
const docFiles = readdirSync(DOCS_DIR).filter(
    (file) => file.endsWith('.md') || file.endsWith('.yaml'),
);

// Generate TypeScript exports
let exports = `/**
 * Documentation resources for Prisma AIRS
 * These are served as static MCP resources
 * 
 * AUTO-GENERATED FILE - DO NOT EDIT
 * Generated by scripts/build-docs.ts
 */

`;

// Process each documentation file
interface ResourceMetadata {
    constName: string;
    mimeType: string;
    name: string;
    description: string;
}

const resources: Record<string, ResourceMetadata> = {};

for (const file of docFiles) {
    const content = readFileSync(join(DOCS_DIR, file), 'utf-8');
    const baseName = file.replace(/\.(md|yaml)$/, '');
    const constName = baseName.toUpperCase().replace(/-/g, '_') + '_DOC';

    // Escape backticks in content
    const escapedContent = content.replace(/`/g, '\\`').replace(/\${/g, '\\${');

    exports += `export const ${constName} = \`${escapedContent}\`;\n\n`;

    // Determine mime type
    const mimeType = file.endsWith('.yaml') ? 'application/x-yaml' : 'text/markdown';

    // Create resource metadata
    const resourceId = baseName.toLowerCase().replace(/_/g, '-');
    resources[resourceId] = {
        constName,
        mimeType,
        // Extract title from markdown frontmatter or use filename
        name: extractTitle(content, baseName),
        description: extractDescription(content, baseName),
    };
}

// Add documentation resources object
exports += `// Documentation metadata for easy access\nexport const DOCUMENTATION_RESOURCES = {\n`;

for (const [id, resource] of Object.entries(resources)) {
    exports += `    '${id}': {
        name: '${resource.name}',
        description: '${resource.description}',
        content: ${resource.constName},
        mimeType: '${resource.mimeType}' as const,
    },\n`;
}

exports += `} as const;\n\n`;
exports += `export type DocumentationResourceId = keyof typeof DOCUMENTATION_RESOURCES;\n`;

// Write the generated file
writeFileSync(OUTPUT_FILE, exports);

// Use process.stdout.write instead of console.log to avoid linting error
process.stdout.write(`✅ Generated documentation exports in ${OUTPUT_FILE}\n`);
process.stdout.write(`📄 Processed ${docFiles.length} documentation files\n`);

// Helper functions
function extractTitle(content: string, filename: string): string {
    // Try to extract from frontmatter
    const titleMatch = content.match(/^title:\s*"?(.+?)"?\s*$/m);
    if (titleMatch) {
        return titleMatch[1];
    }

    // Try to extract from first heading
    const headingMatch = content.match(/^#\s+(.+)$/m);
    if (headingMatch) {
        return headingMatch[1];
    }

    // Fallback to filename
    return filename.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function extractDescription(content: string, filename: string): string {
    // Try to extract from frontmatter
    const descMatch = content.match(/^description:\s*"?(.+?)"?\s*$/m);
    if (descMatch) {
        return descMatch[1];
    }

    // Try to extract first paragraph after heading
    const paragraphMatch = content.match(/^#.*?\n\n(.+?)(?:\n\n|$)/ms);
    if (paragraphMatch) {
        return paragraphMatch[1].replace(/\n/g, ' ').substring(0, 150) + '...';
    }

    // Fallback
    return `Documentation for ${filename.replace(/-/g, ' ')}`;
}
