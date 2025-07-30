---
layout: documentation
title: Detect Sensitive Data Loss
description: Detect and prevent exposure of sensitive data in prompts and responses
category: prisma-airs
permalink: /prisma-airs/sensitive-data-loss/
---

## Overview

Detect and prevent exposure of sensitive data such as API keys, credit card numbers, and PII in prompts and responses.

## The Risk of Data Exposure

AI systems can inadvertently expose sensitive information through:

- Training data leakage
- User input containing secrets
- Generated code with embedded credentials
- Responses that include private data
- Context retention of sensitive information

## Detection Capabilities

### Data Types Protected

#### Financial Information

- **Credit Card Numbers**: All major card types
- **Bank Account Numbers**: Domestic and IBAN
- **Routing Numbers**: ACH and wire transfers
- **Cryptocurrency Keys**: Private keys and seeds

#### Personal Identifiable Information (PII)

- **Social Security Numbers**: US SSN format
- **National IDs**: 50+ country formats
- **Passport Numbers**: International formats
- **Driver's License**: State and country specific

#### Authentication Credentials

- **API Keys**: 100+ service patterns
- **Passwords**: Plain text passwords
- **OAuth Tokens**: Bearer tokens and secrets
- **Database Credentials**: Connection strings

#### Healthcare Data (PHI)

- **Medical Record Numbers**: MRN patterns
- **Insurance IDs**: Policy numbers
- **Health Information**: Diagnoses, medications
- **HIPAA Identifiers**: All 18 types

## API Example

### Request Format

The following cURL request demonstrates scanning for sensitive data:

```bash
curl -L 'https://service.api.aisecurity.paloaltonetworks.com/v1/scan/sync/request' \
--header 'Content-Type: application/json' \
--header 'x-pan-token: <your-API-key>' \
--header 'Accept: application/json' \
--data '{
  "tr_id": "1234",
  "ai_profile": {
    "profile_name": "aisec-profile"
  },
  "metadata": {
    "app_user": "test-user-1",
    "ai_model": "Test AI model"
  },
  "contents": [
    {
      "prompt": "bank account 8775664322 routing number 2344567 dNFYiMZqQrLH35YIsEdgh2OXRXBiE7Ko1lR1nVoiJsUXdJ2T2xiT1gzL8w 6011111111111117 K sfAC3S4qB3b7tP73QBPqbHH0m9rvdcrMdmpI gbpQnQNfhmHaDRLdvrLoWTeDtx9qik0pB68UgOHbHJW7ZpU1ktK7A58icaCZWDlzL6UKswxi8t4z3 x1nK4PCsseq94a02GL7f7KkxCy7gkzfEqPWdF4UBexP1JM3BGMlTzDKb2",
      "response": "This is a test response"
    }
  ]
}'
```

### Response Format

When sensitive data is detected, the API returns:

```json
{
    "action": "block",
    "category": "malicious",
    "profile_name": "aisec-profile-demo",
    "prompt_detected": {
        "dlp": true,
        "injection": false,
        "url_cats": false
    },
    "report_id": "R00000000-0000-0000-0000-000000000000",
    "response_detected": {
        "dlp": false,
        "url_cats": false
    },
    "scan_id": "00000000-0000-0000-0000-000000000000",
    "tr_id": "1234"
}
```

**Key Response Fields**:

- `prompt_detected.dlp`: `true` indicates sensitive data was detected in the prompt
- `response_detected.dlp`: `true` indicates sensitive data was detected in the response
- `category`: Set to `"malicious"` when DLP match found, `"benign"` otherwise
- `action`: Based on your AI security profile settings (e.g., `"block"`)

**Note**: Enable Sensitive Data Detection with Basic or Advanced options in the API security profile for this detection.

## Common Sensitive Data Patterns

### Financial Data

- Bank account numbers with routing numbers
- Credit card numbers (all major formats)
- SWIFT/BIC codes
- Cryptocurrency private keys

### Authentication Secrets

- API keys and tokens
- OAuth credentials
- JWT tokens
- Database connection strings

### Personal Information

- Social Security Numbers
- Passport numbers
- Driver's license numbers
- National identification numbers

## Response Actions

The specific action shown in the response is based on your AI security profile settings:

1. **Block**: Prevent processing when sensitive data detected
2. **Mask**: Redact sensitive information (if configured)
3. **Alert**: Log detection for security monitoring
4. **Allow with Warning**: Proceed with caution flag

## Performance Considerations

- **Pattern Matching**: High-speed regex and ML-based detection
- **False Positive Tuning**: Configurable sensitivity levels
- **Batch Processing**: Efficient scanning of large payloads
- **Real-time Detection**: Minimal latency impact

## Related Resources

- [API Reference]({{ site.baseurl }}/developers/api)
- [Overview]({{ site.baseurl }}/prisma-airs/)
- [Mask Sensitive Data]({{ site.baseurl }}/prisma-airs/mask-sensitive-data)
