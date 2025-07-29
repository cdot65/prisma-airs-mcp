---
layout: documentation
title: Documentation Resources
permalink: /developers/src/resources/documentation-resources/
category: developers
---

The documentation resources feature provides comprehensive developer documentation through the MCP resources interface. This allows AI assistants and tools to access API documentation, integration guides, error references, and examples directly through resource URIs.

## Overview

Documentation resources are static resources that are built at compile time and embedded into the server bundle. This approach ensures:

- Fast access without file I/O
- Version-controlled documentation
- Consistent content across deployments
- No runtime dependencies on the file system

## Architecture

### Build Process

```text
┌──────────────────────────────────┐
│   Source Documentation Files     │
│  src/resources/docs/*.md/*.yaml  │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│    Build Script Execution        │
│  scripts/build-docs.ts           │
│  • Read all .md and .yaml files  │
│  • Generate TypeScript exports   │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│    Generated TypeScript          │
│  src/resources/docs/index.ts     │
│  • Export constants for each doc │
│  • Escaped content strings       │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│    TypeScript Compilation        │
│  • Bundle docs into dist/        │
│  • No runtime file access needed │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│    Runtime Access via MCP        │
│  • List documentation resources  │
│  • Read content by URI           │
└──────────────────────────────────┘
```

## Implementation Details

### Build Script

The build script (`scripts/build-docs.ts`) performs the following steps:

```typescript
import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const DOCS_DIR = join(__dirname, '../src/resources/docs');
const OUTPUT_FILE = join(DOCS_DIR, 'index.ts');

// Read all documentation files
const docFiles = readdirSync(DOCS_DIR).filter(file => 
    file.endsWith('.md') || file.endsWith('.yaml')
);

// Generate TypeScript exports
let exports = '// Auto-generated file - DO NOT EDIT\n\n';

for (const file of docFiles) {
    const content = readFileSync(join(DOCS_DIR, file), 'utf-8');
    const baseName = file.replace(/\.(md|yaml)$/, '');
    const constName = baseName.toUpperCase().replace(/-/g, '_') + '_DOC';
    
    // Escape backticks and template literals
    const escapedContent = content
        .replace(/`/g, '\\`')
        .replace(/\${/g, '\\${');
    
    exports += `export const ${constName} = \`${escapedContent}\`;\n\n`;
}

writeFileSync(OUTPUT_FILE, exports);
```

### Resource Handler Integration

The ResourceHandler class includes documentation resources in its listing and reading methods:

```typescript
import {
    AIRUNTIMESECURITYAPI_DOC,
    ERRORCODES_DOC,
    USECASES_DOC,
    SCANSERVICE_DOC,
    INTEGRATION_GUIDE_DOC,
    SECURITY_FEATURES_DOC,
} from './docs';

// Documentation resource metadata
const DOCUMENTATION_RESOURCES = {
    'airuntimesecurityapi': {
        content: AIRUNTIMESECURITYAPI_DOC,
        mimeType: 'text/markdown',
        name: 'Prisma AIRS AI Runtime API Intercept',
        description: 'Complete API reference and overview for Prisma AIRS',
    },
    'errorcodes': {
        content: ERRORCODES_DOC,
        mimeType: 'text/markdown',
        name: 'Error Codes Reference',
        description: 'Comprehensive list of error codes and their meanings',
    },
    'usecases': {
        content: USECASES_DOC,
        mimeType: 'text/markdown',
        name: 'Use Cases Guide',
        description: 'Example use cases and implementation patterns',
    },
    'scanservice': {
        content: SCANSERVICE_DOC,
        mimeType: 'application/x-yaml',
        name: 'OpenAPI Specification',
        description: 'OpenAPI 3.0 specification for Prisma AIRS scan service',
    },
    'integration-guide': {
        content: INTEGRATION_GUIDE_DOC,
        mimeType: 'text/markdown',
        name: 'Integration Guide',
        description: 'Step-by-step guide for integrating Prisma AIRS',
    },
    'security-features': {
        content: SECURITY_FEATURES_DOC,
        mimeType: 'text/markdown',
        name: 'Security Features Guide',
        description: 'Detailed documentation of security features and capabilities',
    },
};
```

## Available Documentation

### API Documentation (`airuntimesecurityapi`)

**URI:** `airs://developer-docs/airuntimesecurityapi`  
**Type:** Markdown  
**Content:** Complete API reference including endpoints, authentication, request/response formats, and examples.

### Error Codes (`errorcodes`)

**URI:** `airs://developer-docs/errorcodes`  
**Type:** Markdown  
**Content:** Comprehensive list of all error codes with descriptions and resolution steps.

### Use Cases (`usecases`)

**URI:** `airs://developer-docs/usecases`  
**Type:** Markdown  
**Content:** Real-world use cases with implementation examples and best practices.

### OpenAPI Specification (`scanservice`)

**URI:** `airs://developer-docs/scanservice`  
**Type:** YAML  
**Content:** Complete OpenAPI 3.0 specification for the Prisma AIRS scan service.

### Integration Guide (`integration-guide`)

**URI:** `airs://developer-docs/integration-guide`  
**Type:** Markdown  
**Content:** Step-by-step integration instructions with code examples.

### Security Features (`security-features`)

**URI:** `airs://developer-docs/security-features`  
**Type:** Markdown  
**Content:** Detailed documentation of all security features and threat detection capabilities.

## Usage Examples

### Listing Documentation Resources

```bash
# List all resources (includes documentation)
curl -X POST http://localhost:3000/ \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "1",
    "method": "resources/list",
    "params": {}
  }'

# Response includes:
{
  "jsonrpc": "2.0",
  "id": "1",
  "result": {
    "resources": [
      {
        "uri": "airs://developer-docs/airuntimesecurityapi",
        "name": "Prisma AIRS AI Runtime API Intercept",
        "description": "Complete API reference and overview for Prisma AIRS",
        "mimeType": "text/markdown"
      },
      // ... other documentation resources
    ]
  }
}
```

### Reading Documentation Content

```bash
# Read API documentation
curl -X POST http://localhost:3000/ \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "2",
    "method": "resources/read",
    "params": {
      "uri": "airs://developer-docs/airuntimesecurityapi"
    }
  }'

# Response:
{
  "jsonrpc": "2.0",
  "id": "2",
  "result": {
    "contents": [{
      "uri": "airs://developer-docs/airuntimesecurityapi",
      "mimeType": "text/markdown",
      "text": "# Prisma AIRS AI Runtime API Intercept\n\n..."
    }]
  }
}
```

### JavaScript/TypeScript Client

```typescript
// Using an MCP client library
const client = new MCPClient('http://localhost:3000');

// List all documentation resources
const resources = await client.listResources();
const docs = resources.filter(r => 
    r.uri.startsWith('airs://developer-docs/')
);

// Read specific documentation
const apiDocs = await client.readResource(
    'airs://developer-docs/airuntimesecurityapi'
);
console.log(apiDocs.contents[0].text);

// Read OpenAPI specification
const openapi = await client.readResource(
    'airs://developer-docs/scanservice'
);
const spec = yaml.parse(openapi.contents[0].text);
```

## Benefits

### 1. Performance

- No runtime file I/O operations
- Content served from memory
- Fast response times
- Reduced server load

### 2. Reliability

- Documentation always available
- No file system dependencies
- Consistent across deployments
- Version-controlled content

### 3. Security

- No direct file system access
- Content validated at build time
- Safe from path traversal attacks
- Controlled access through MCP

### 4. Developer Experience

- Easy to update documentation
- Automatic TypeScript type checking
- IDE support for content
- Simple testing process

## Adding New Documentation

To add new documentation resources:

1. **Create Documentation File**

   ```bash
   # Add markdown file
   echo "# My New Guide" > src/resources/docs/my-guide.md
   
   # Or add YAML file
   echo "version: 1.0" > src/resources/docs/config.yaml
   ```

2. **Update Build Script** (if needed)
   - The script automatically picks up new files
   - No changes needed for standard .md/.yaml files

3. **Add Metadata**

   ```typescript
   // In src/resources/index.ts
   const DOCUMENTATION_RESOURCES = {
       // ... existing resources
       'my-guide': {
           content: MY_GUIDE_DOC,
           mimeType: 'text/markdown',
           name: 'My New Guide',
           description: 'Description of the guide',
       },
   };
   ```

4. **Build and Test**

   ```bash
   npm run build
   npm run dev
   
   # Test the new resource
   curl -X POST http://localhost:3000/ \
     -H "Content-Type: application/json" \
     -d '{
       "jsonrpc": "2.0",
       "id": "1",
       "method": "resources/read",
       "params": {
         "uri": "airs://developer-docs/my-guide"
       }
     }'
   ```

## Best Practices

### 1. Documentation Format

- Use clear, consistent markdown formatting
- Include code examples with syntax highlighting
- Add section headers for navigation
- Keep line lengths reasonable

### 2. File Naming

- Use kebab-case for file names
- Be descriptive but concise
- Match file names to resource IDs
- Use appropriate extensions (.md, .yaml)

### 3. Content Guidelines

- Focus on developer needs
- Include practical examples
- Explain error scenarios
- Provide troubleshooting tips

### 4. Maintenance

- Review documentation regularly
- Update examples with API changes
- Test documentation builds
- Monitor for broken links

## Troubleshooting

### Build Errors

```bash
# If build fails, check:
1. File permissions in src/resources/docs/
2. Valid UTF-8 encoding
3. Proper escaping of special characters
4. No syntax errors in YAML files
```

### Missing Resources

```bash
# Verify documentation was built:
ls -la src/resources/docs/index.ts

# Check if resource is registered:
grep "my-guide" src/resources/index.ts
```

### Content Issues

```bash
# Test content directly:
node -e "
  const { MY_GUIDE_DOC } = require('./dist/resources/docs');
  console.log(MY_GUIDE_DOC.substring(0, 100));
"
```

## Future Enhancements

### Planned Features

1. **Markdown Processing**
   - TOC generation
   - Link validation
   - Code syntax highlighting

2. **Search Capabilities**
   - Full-text search across docs
   - Keyword indexing
   - Relevance ranking

3. **Versioning**
   - Multiple doc versions
   - Version selection
   - Migration guides

4. **Localization**
   - Multi-language support
   - Locale detection
   - Translation management

## Related Documentation

- [Resources Overview]({{ site.baseurl }}/developers/src/resources/overview/) - Module overview
- [Resources Index]({{ site.baseurl }}/developers/src/resources/index-file/) - Implementation details
- [Build Scripts]({{ site.baseurl }}/developers/scripts/build-docs/) - Build script documentation
- [MCP Protocol]({{ site.baseurl }}/developers/src/types/mcp-types/) - Protocol specification
