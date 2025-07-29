---
layout: documentation
title: Secure Model Context Protocol (MCP)
description: Guard against tool poisoning and prompt injection in agentic AI workflows
category: prisma-airs
---

## Overview

Guard against 'tool poisoning' and prompt injection in agentic AI workflows. Use API Intercept to scan and validate MCP tool descriptions, inputs, and outputs—building guardrails that keep your agents safe.

## MCP Security Challenges

As the blog post highlights, MCP is "insecure by default" - similar to how HTTP was when first released. The Model Context Protocol introduces new attack vectors:

### Tool Poisoning

Tool Poisoning is a form of indirect prompt injection where MCP servers embed malicious instructions inside tool descriptions. These instructions can be invisible to end users but visible to AI applications/agents, enabling attackers to potentially:

- **Exfiltrate sensitive files/data**
- **Execute malicious code** on MCP hosts
- **Hijack agent behavior**, overriding instructions from trusted servers
- **Conduct "rug pulls"**, where tool descriptions are modified post-approval
- **Perform tool shadowing**, influencing how agents use tools from trusted servers

## The Antidote: API Intercept

The core issue is that MCP clients may not expose full tool descriptions or provide a way to validate those descriptions and actions more rigorously. The solution involves addressing two key problems:

1. **Tool descriptions can't be trusted**
2. **Tool descriptions can suddenly change**

## Practical Implementation

### Detecting Tool Description Changes

Here's a practical implementation using SHA256 hashing and SQLite to detect "rug pulls":

```python
# ─── TOOL GUARDRAIL ───────────────────────────────────────────────────────────
def compute_hash(text: str) -> str:
    """Compute hash for tool description."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


async def init_hash_db(tools, db_path: Path = DB_PATH):
    """Initialize tools database."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS tool_hashes (
            name TEXT PRIMARY KEY,
            hash TEXT NOT NULL
        )
    """
    )
    conn.commit()

    cols = [r[1] for r in cursor.execute("PRAGMA table_info(tool_hashes)").fetchall()]
    if "description" not in cols:
        cursor.execute("ALTER TABLE tool_hashes ADD COLUMN description TEXT")
        conn.commit()
        for t in tools:
            cursor.execute(
                "UPDATE tool_hashes SET description = ? WHERE name = ?",
                (t.description, t.name),
            )
        conn.commit()
    conn.close()


async def verify_tool_hashes_interactive(tools, db_path: Path = DB_PATH):
    "Detects and prevents potential rug pull attack."
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM tool_hashes")
    existing_count = cursor.fetchone()[0]

    for t in tools:
        name, new_desc = t.name, t.description
        new_hash = compute_hash(new_desc)
        cursor.execute(
            "SELECT hash, description FROM tool_hashes WHERE name = ?", (name,)
        )
        row = cursor.fetchone()

        if existing_count == 0:
            cursor.execute(
                "INSERT INTO tool_hashes(name, hash, description) VALUES(?,?,?)",
                (name, new_hash, new_desc),
            )
            continue

        if row is None:
            print(f"\n🔍 New tool detected: {name}\n{new_desc}\n")
            if input("Accept this new tool? (y/n): ").strip().lower() != "y":
                print("Aborting: new tool not approved.")
                sys.exit(1)
            cursor.execute(
                "INSERT INTO tool_hashes(name, hash, description) VALUES(?,?,?)",
                (name, new_hash, new_desc),
            )
            conn.commit()
            continue

        old_hash, old_desc = row
        if old_hash != new_hash:
            print(f"\n🛑 Description change for {name}:")
            print("--- Old: ---\n", old_desc)
            print("--- New: ---\n", new_desc)
            if input("Accept updated description? (y/n): ").strip().lower() != "y":
                print("Aborting: description change not approved.")
                sys.exit(1)
            cursor.execute(
                "UPDATE tool_hashes SET hash=?,description=? WHERE name=?",
                (new_hash, new_desc, name),
            )
            conn.commit()

    conn.close()
```

### API Intercept Guardrails

To address untrusted tool descriptions, use Prisma AIRS API Intercept to scan:

1. **MCP tool descriptions** - upon initialization
2. **Agent input text** - before processing
3. **Agent output text** - before returning to user

```python
# ─── AIRS GUARDRAIL ────────────────────────────────────────────────────────────
async def scan_with_airs(prompt_or_response: str) -> GuardrailFunctionOutput:
    """Scan text with API Intercept"""
    payload = {
        "ai_profile": {"profile_name": AIRS_PROFILE_NAME},
        "contents": [{"prompt": prompt_or_response}],
    }
    headers = {"x-pan-token": AIRS_API_KEY, "Content-Type": "application/json"}
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(AIRS_SCAN_ENDPOINT, json=payload, headers=headers)
        data = resp.json()
    scan = AIRSScanResult(
        category=data.get("category", "unknown"),
        action=data.get("action", "allow"),
        prompt_detected=data.get("prompt_detected", {}),
    )
    trip = scan.category != "benign" or scan.action == "block"
    return GuardrailFunctionOutput(output_info=scan, tripwire_triggered=trip)


@input_guardrail
async def airs_input_guardrail(
    ctx: RunContextWrapper[None], agent, input: Union[str, List[TResponseInputItem]]
) -> GuardrailFunctionOutput:
    """Input guardrail"""
    text = input if isinstance(input, str) else " ".join(str(i) for i in input)
    return await scan_with_airs(text)


@output_guardrail
async def airs_output_guardrail(
    ctx: RunContextWrapper, agent, output: AgentOutput
) -> GuardrailFunctionOutput:
    """Output guardrail"""
    return await scan_with_airs(output)


async def validate_mcp_tool_descriptions(tools):
    """Validate tool descriptions"""
    for t in tools:
        res = await scan_with_airs(t.description)
        if res.tripwire_triggered:
            raise ValueError(f"🛑 Guardrail tripped on tool {t.name}:\n{t.description}")
```

## Key Implementation Points

### Detection Capabilities

- **SHA256 hashing** to detect tool description changes
- **SQLite persistence** for tracking tool description history
- **Interactive prompts** for human review of changes
- **API Intercept scanning** for malicious content detection

### User Experience

When a guardrail is triggered:

- **Rug Pull Detection**: Shows old vs new descriptions, prompts for approval
- **Tool Poisoning Detection**: Blocks malicious tool descriptions with clear error messages

## Best Practices

### 1. Defense in Depth

Just as HTTP evolved with SSL/TLS, PKI, and browser safeguards, MCP security requires multiple layers:

- Hash-based change detection
- API-based threat scanning
- Human review for critical changes
- Immutable tool objects after initialization

### 2. Structure Agent Flows

Design your agent flows so that tripping a guardrail results in either:

- Prompting the end user for permission to continue
- Exiting to avoid possible exploitation

### 3. Scan Multiple Points

Don't just scan tool descriptions - also scan:

- Context retrieved via MCP
- Prompt templates
- Agent inputs and outputs

## Closing Thoughts

As the blog post notes: "Although not a complete solution, as Obi-wan might say, 'it's a first step into a larger world.'"

MCP is on a similar path to HTTP - starting as "insecure by default" but evolving with security measures. With guardrails built on API Intercept, you now have a way to programmatically scan tool descriptions, prompts, and responses — surfacing hidden instructions, malicious payloads, sensitive data, and more.

## Related Resources

- [API Reference]({{ site.baseurl }}/developers/api)
- [AI Agent Threats]({{ site.baseurl }}/prisma-airs/ai-agent-threats)
- [Overview]({{ site.baseurl }}/prisma-airs/)
