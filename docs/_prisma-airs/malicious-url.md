---
layout: documentation
title: Detect Malicious URL
description: Scan for and block malicious URLs in AI model outputs and responses
category: prisma-airs
---

## Overview

Scan for and block malicious URLs in AI model outputs and responses, preventing phishing or malware delivery.

## Why URL Scanning Matters

AI systems can inadvertently generate or propagate malicious URLs that could:

- Lead users to phishing sites
- Distribute malware
- Expose users to scams
- Compromise enterprise security
- Damage brand trust

## Detection Capabilities

### Threat Categories

- **Phishing Sites**: Fake login pages and credential harvesters
- **Malware Distribution**: Sites hosting viruses, trojans, or ransomware
- **Command & Control**: Botnet communication endpoints
- **Scam Websites**: Fraudulent shopping or investment sites
- **Exploit Kits**: Sites that exploit browser vulnerabilities
- **URL Shorteners**: Malicious links hidden behind shortened URLs

## API Example

### Request Format

The following cURL request demonstrates scanning for malicious URLs in AI responses:

```bash
curl -L 'https://service.api.aisecurity.paloaltonetworks.com/v1/scan/sync/request' \
--header 'Content-Type: application/json' \
--header 'x-pan-token: <your-API-token>' \
--header 'Accept: application/json' \
--data '{
  "tr_id": "1234",
  "ai_profile": {
    "profile_id": "00000000-0000-0000-0000-000000000000",
    "profile_name": "dummy-profile"
  },
  "metadata": {
    "app_user": "test-user-2",
    "ai_model": "Test AI model",
    "user_ip": "10.5.0.2"
  },
  "contents": [
    {
      "response": "This is a test prompt with urlfiltering.paloaltonetworks.com/test-malware url"
    }
  ]
}'
```

### Response Format

When a malicious URL is detected, the API returns:

```json
{
  "action": "block",
  "category": "malicious",
  "profile_id": "00000000-0000-0000-0000-000000000000",
  "profile_name": "dummy-profile",
  "prompt_detected": {},
  "report_id": "R00000000-0000-0000-0000-000000000000",
  "response_detected": {
    "db_security": false,
    "dlp": false,
    "url_cats": true
  },
  "scan_id": "00000000-0000-0000-0000-000000000000",
  "tr_id": "1234"
}
```

**Key Response Fields**:
- `response_detected.url_cats`: `true` indicates malicious URL was detected
- `category`: Set to `"malicious"` when threat URL is found
- `action`: The recommended action (e.g., `"block"`)
- `report_id`: Reference for detailed threat analysis

**Note**: Enable Malicious URL Detection with Basic or Advanced options (with custom URL filtering) in the API security profile for this detection.

## Common Threat Patterns

### Phishing URLs
- Typosquatted domains mimicking legitimate services
- Fake login pages for credential harvesting
- Deceptive URLs using homograph attacks

### Malware Distribution
- Direct download links to executables
- Drive-by download sites
- Compromised legitimate sites

### URL Obfuscation
- Shortened URLs hiding malicious destinations
- Encoded URLs to bypass filters
- Redirect chains to malicious sites

## Response Actions

When malicious URLs are detected:

1. **Block**: Prevent the response from reaching the user
2. **Sanitize**: Remove or replace the malicious URL
3. **Alert**: Notify security team of the threat
4. **Report**: Log for threat intelligence analysis

## Performance Considerations

- **Real-time Analysis**: URL reputation checked against threat intelligence
- **Latency Impact**: Minimal overhead for URL scanning
- **Cache Efficiency**: Known malicious URLs cached for faster detection
- **Update Frequency**: Threat intelligence updated continuously

## Related Resources

- [API Reference]({{ site.baseurl }}/developers/api)
- [Overview]({{ site.baseurl }}/prisma-airs/overview)
- [Prompt Injection Detection]({{ site.baseurl }}/prisma-airs/prompt-injection)