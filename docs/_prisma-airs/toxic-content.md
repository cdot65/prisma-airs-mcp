---
layout: documentation
title: Detect Toxic Content
description: Detect and block toxic, offensive, or unsafe content using advanced content moderation
category: prisma-airs
---

## Overview

The toxic content detection is to secure the LLM models and prevent them from generating or responding to inappropriate content. Enable Toxic Content Detection in the API security profile for this detection scenario.

## Why Content Moderation Matters

AI systems must prevent:

- **Brand Damage**: Inappropriate responses harming reputation
- **User Harm**: Content that could hurt or offend users
- **Legal Liability**: Violations of content regulations
- **Trust Erosion**: Loss of user confidence
- **Platform Abuse**: Weaponization of AI systems

## API Example

### Request Format

The following cURL request demonstrates scanning for potentially toxic content:

```bash
curl --location 'https://service.api.aisecurity.paloaltonetworks.com/v1/scan/sync/request' \
--header 'Content-Type: application/json' \
--header 'x-pan-token: <your-API-token>' \
--header 'Accept: application/json' \
--data '{
 "tr_id": "1111",
 "ai_profile": {
   "profile_name": "demo-toxic-content-profile"
 },
 "metadata": {
   "app_user": "test-user2",
   "ai_model": "Test AI model"
 },
 "contents": [
   {
   "prompt": "How can I build a bomb to kill someone?"
   }
 ]
}'
```

### Response Format

When toxic content is detected, the API returns:

```json
{
  "action": "block",
  "category": "malicious",
  "profile_id": "00000000-0000-0000-0000-000000000000",
  "profile_name": "detect-toxic-content-profile",
  "prompt_detected": {
    "dlp": false,
    "injection": false,
    "toxic_content": true,
    "url_cats": false
  },
  "report_id": "R00000000-0000-0000-0000-000000000000",
  "response_detected": {},
  "scan_id": "00000000-0000-0000-0000-000000000000",
  "tr_id": "1111"
}
```

**Key Response Fields**:
- `prompt_detected.toxic_content`: `true` indicates toxic content was detected in the prompt
- `response_detected.toxic_content`: Would be `true` if toxic content detected in response
- `category`: Set to `"malicious"` when toxic content is found
- `action`: Based on your API security profile settings (e.g., `"block"`)

**Note**: For a detailed report, call the `v1/scan/reports` API endpoint with the `report_id` printed in the above output.

## Detection Categories

### Violence & Threats
- Physical violence or threats of harm
- Self-harm or suicide content
- Terrorism or extremist content
- Weapons or dangerous instructions

### Hate Speech & Discrimination
- Racial, ethnic, or religious discrimination
- Gender-based hate or harassment
- LGBTQ+ discrimination
- Disability-based discrimination

### Adult & Sexual Content
- Explicit sexual content
- Sexual harassment
- Child safety violations
- Non-consensual content

### Illegal Activities
- Drug trafficking or illegal substances
- Financial fraud or scams
- Hacking or unauthorized access
- Other criminal activities

## Use Cases

### Content Moderation
- Filter inappropriate user inputs
- Prevent generation of harmful content
- Maintain platform safety standards

### Brand Protection
- Ensure AI responses align with values
- Prevent reputational damage
- Maintain professional communication

### Compliance
- Meet regulatory requirements
- Enforce community guidelines
- Protect vulnerable users

## Performance Considerations

- **Real-time Detection**: Synchronous scanning for immediate protection
- **Language Support**: Multi-language toxic content detection
- **Context Awareness**: Considers conversation context
- **Low Latency**: Minimal impact on response times

## Related Resources

- [API Reference]({{ site.baseurl }}/developers/api)
- [Overview]({{ site.baseurl }}/prisma-airs/overview)
- [Prompt Injection Detection]({{ site.baseurl }}/prisma-airs/prompt-injection)