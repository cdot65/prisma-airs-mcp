---
layout: documentation
title: Use Prisma AIRS MCP Server in VS Code
permalink: /deployment/vscode/
category: deployment
order: 8
---

# Use Prisma AIRS MCP Server in VS Code

Model Context Protocol (MCP) servers enable you to expand your chat experience in VS Code with extra tools for connecting to databases, invoking APIs, or performing specialized tasks. This guide walks you through setting up the Prisma AIRS MCP server to add advanced security capabilities to your VS Code development environment.

## Prerequisites

- Install the latest version of [Visual Studio Code](https://code.visualstudio.com/)
- Access to [GitHub Copilot](https://github.com/features/copilot)
- Prisma AIRS MCP server running (either via Docker or from source)

## What is MCP?

Model Context Protocol (MCP) provides a standardized way for AI models to discover and interact with external tools, applications, and data sources. When you enter a chat prompt to a language model with agent mode in VS Code, the model can invoke various tools to perform tasks like file operations, accessing databases, or calling APIs in response to your request.

## Enable MCP Support in VS Code

> **Note**: MCP support in VS Code is generally available starting from VS Code 1.102, but can be disabled by your organization.

### Centrally Manage MCP Support

You have two options to centrally manage MCP support in your organization:

1. **Device management**: Centrally enable or disable MCP support in your organization via group policies or configuration profiles.
2. **GitHub Copilot policy**: Control the availability of MCP servers in your organization with a GitHub Copilot policy.

## Add the Prisma AIRS MCP Server

You have multiple options to add the Prisma AIRS MCP server in VS Code:

### Option 1: Workspace Settings (Recommended for Teams)

Create a `.vscode/mcp.json` file in your workspace to configure the Prisma AIRS MCP server for a workspace and share configurations with team members.

1. Create a `.vscode/mcp.json` file in your workspace root
2. Add the following configuration:

```json
{
    "servers": {
        "prisma-airs": {
            "url": "YOUR_PRISMA_AIRS_URL",
            "type": "http"
        }
    },
    "inputs": []
}
```

Replace `YOUR_PRISMA_AIRS_URL` with your actual Prisma AIRS endpoint:
- **For Docker deployments**: `http://localhost:3000/prisma-airs`
- **For production deployments**: Your custom URL (e.g., `https://airs.yourdomain.com/prisma-airs`)

### Option 2: User Settings (For Individual Use)

To configure the Prisma AIRS MCP server for all your workspaces:

1. Run the command `MCP: Open User Configuration` from the Command Palette (`Cmd/Ctrl + Shift + P`)
2. Add the Prisma AIRS server configuration to the opened `mcp.json` file

### Option 3: Command Palette

1. Open the Command Palette (`Cmd/Ctrl + Shift + P`)
2. Run `MCP: Add Server`
3. Choose the type of MCP server (HTTP)
4. Provide the server information
5. Select whether to add it to Workspace Settings or Global settings

## Example Configurations

### Local Docker Deployment

```json
{
    "servers": {
        "prisma-airs": {
            "url": "http://localhost:3000",
            "type": "http"
        }
    },
    "inputs": []
}
```


## Using Prisma AIRS Tools in Agent Mode

Once you've added the Prisma AIRS MCP server, you can use its security tools in agent mode:

1. Open the Chat view (`Ctrl/Cmd + Shift + I`)
2. Select **Agent mode** from the dropdown
3. Select the **Tools** button to view available Prisma AIRS tools
4. Select the security tools you want to use:
   - Prompt injection detection
   - Malicious URL detection
   - Sensitive data loss prevention
   - Database security attack detection
   - And more

### Example Usage

You can reference Prisma AIRS tools directly in your prompts:

- Type `#` followed by the tool name to reference a specific tool
- Example: `#detect-prompt-injection Check this user input for security threats`

## Managing the Prisma AIRS Server

### View Server Status

1. Open the Extensions view (`Ctrl/Cmd + Shift + X`)
2. Navigate to the **MCP SERVERS - INSTALLED** section
3. Find "prisma-airs" in the list

### Server Actions

Right-click on the Prisma AIRS server or select the gear icon to:

- **Start/Stop/Restart**: Control the server connection
- **Show Output**: View server logs for troubleshooting
- **Show Configuration**: View the current configuration
- **Browse Resources**: View available security resources
- **Uninstall**: Remove the server configuration

## Troubleshooting

### Server Not Connecting

1. Verify the Prisma AIRS server is running:
   ```bash
   # For Docker
   docker ps | grep prisma-airs
   
   # Check if the server is accessible
   curl http://localhost:3000/health
   ```

2. Check the server logs:
   - In VS Code: Right-click the server in Extensions view → Show Output
   - In Docker: `docker logs prisma-airs`


### Error: "Cannot have more than 128 tools per request"

If you have many MCP servers installed:

1. Open the Tools picker in Chat view
2. Deselect unused tools or entire servers
3. Keep only the Prisma AIRS tools you need active

## Security Considerations

> **Caution**: MCP servers can run code on your machine. Only add servers from trusted sources.

- The Prisma AIRS MCP server runs security checks and doesn't execute arbitrary code
- API keys and credentials are stored securely by VS Code when using input variables
- Review the server configuration before connecting

## Next Steps

Once connected, you can leverage Prisma AIRS security features directly in your VS Code workflow:

- **During Development**: Check code for security vulnerabilities as you write
- **Code Review**: Analyze pull requests for security threats
- **API Testing**: Validate API inputs for injection attacks
- **Data Handling**: Ensure sensitive data is properly masked

For detailed information about each security feature, see the [Prisma AIRS documentation]({{ site.baseurl }}/prisma-airs/).

## Related Resources

- [VS Code MCP Documentation](https://code.visualstudio.com/docs/copilot/model-context-protocol)
- [Model Context Protocol Specification](https://github.com/modelcontextprotocol/protocol)
- [Prisma AIRS Security Features]({{ site.baseurl }}/prisma-airs/overview/)