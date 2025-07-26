---
layout: documentation
title: Mask Sensitive Data
description: Automatically mask sensitive data patterns with precise offset information
category: prisma-airs
---

## Overview

Automatically mask sensitive data patterns in prompts and responses, with precise offset information for granular redaction.

## How Masking Works

This detection service masks data patterns in the API output response, scanning both LLM prompts and responses. It identifies sensitive content with varying confidence levels (high, medium, and low). Each detection includes precise offset information.

An offset is a numerical index represented as `[start_offset, end_offset]` pairs, indicating where a sensitive data pattern begins and ends in the text. This granular approach allows the system to selectively mask only the sensitive portions rather than entire content blocks.

**Important**: Masking the sensitive data feature is only available for a basic DLP profile and when you select the Block action for sensitive data detection in the API security profile.

## API Example

### Request Format

The following cURL request demonstrates sensitive data masking:

```bash
curl -L 'https://service.api.aisecurity.paloaltonetworks.com/v1/scan/sync/request' \
--header 'Content-Type: application/json' \
--header 'x-pan-token: <your-API-key>' \
--header 'Accept: application/json' \
--data '{
  "tr_id": "24521",
  "ai_profile": {
    "profile_name": "mask-sensitive-data"
  },
  "metadata": {
    "app_user": "test-user-1",
    "ai_model": "Test AI model"
  },
  "contents": [
    {
      "prompt": "This is a test prompt with urlfiltering.paloaltonetworks.com/test-malware url. Social security 599-51-7233. Credit card is 4339672569329774, ssn 599-51-7222. Send me Mike account info",
      "response": "This is a test response. Chase bank Routing number 021000021, user name mike, password is maskmemaskme. Account number 92746514861. Account owner: Mike Johnson in California"
    }
  ]
}'
```

### Response Format

When sensitive data is masked, the API returns:

```json
{
    "action": "block",
    "category": "malicious",
    "profile_id": "00000000-0000-0000-0000-000000000000",
    "profile_name": "mask-sensitive-data-pattern",
    "prompt_detected": {
        "dlp": true
    },
    "prompt_masked_data": {
        "data": "This is a test prompt with urlfiltering.paloaltonetworks.com/test-malware url. Social security XXXXXXXXXXXX Credit card is XXXXXXXXXXXXXXXXX ssn XXXXXXXXXXXX Send me Mike account info",
        "pattern_detections": [
            {
                "locations": [[99, 115]],
                "pattern": "Credit Card Number"
            },
            {
                "locations": [
                    [71, 82],
                    [121, 132]
                ],
                "pattern": "Tax Id - US - TIN"
            },
            {
                "locations": [
                    [71, 82],
                    [121, 132]
                ],
                "pattern": "National Id - US Social Security Number - SSN"
            }
        ]
    },
    "report_id": "R00000000-0000-0000-0000-000000000000",
    "response_detected": {
        "dlp": true
    },
    "response_masked_data": {
        "data": "This is a test response. Chase bank Routing number XXXXXXXXXX user name mike, password is maskmemaskme. Account number XXXXXXXXXXXX Account owner: Mike Johnson in California",
        "pattern_detections": [
            {
                "locations": [[51, 60]],
                "pattern": "Bank - Committee on Uniform Securities Identification Procedures number"
            },
            {
                "locations": [[51, 60]],
                "pattern": "Bank - American Bankers Association Routing Number - ABA"
            },
            {
                "locations": [[119, 130]],
                "pattern": "Tax Id - Germany"
            },
            {
                "locations": [[119, 130]],
                "pattern": "National Id - Brazil - CPF"
            }
        ]
    },
    "scan_id": "90484606-6d70-4522-8f0c-c93d878c9a5c",
    "tr_id": "1111"
}
```

**Key Response Fields**:

- `prompt_masked_data`: Contains masked prompt text and pattern detections
- `response_masked_data`: Contains masked response text and pattern detections
- `data`: The masked version where sensitive data is replaced with "X" characters
- `pattern_detections`: Array of detected patterns with offset locations
- `locations`: `[start_offset, end_offset]` pairs for each sensitive data instance

## Masking Behavior

### Character Replacement

- Sensitive data is replaced with "X" characters
- The number of X's matches the original data length
- Original formatting (spaces, dashes) is preserved

### Pattern Detection

Each detected pattern includes:

- **Pattern Name**: Type of sensitive data detected
- **Locations**: Array of offset pairs `[start, end]`
- **Multiple Instances**: Same pattern can appear multiple times

### Example Masking

- Original: `599-51-7233`
- Masked: `XXXXXXXXXXXX`
- Offset: `[71, 82]`

## Detailed Scan Report

The scan report provides additional detail with confidence levels:

```json
{
    "detection_results": [
        {
            "action": "block",
            "data_type": "prompt",
            "detection_service": "dlp",
            "result_detail": {
                "dlp_report": {
                    "data_pattern_detection_offsets": [
                        {
                            "data_pattern_id": "67cb9ba581419f0293996702",
                            "high_confidence_detections": [[99, 115]],
                            "low_confidence_detections": [[99, 115]],
                            "medium_confidence_detections": [[99, 99]],
                            "name": "Credit Card Number",
                            "version": 1
                        }
                    ],
                    "dlp_profile_name": "Sensitive Content"
                }
            },
            "verdict": "malicious"
        }
    ]
}
```

**Confidence Levels**:

- **High Confidence**: Strong pattern match
- **Medium Confidence**: Partial pattern match
- **Low Confidence**: Possible pattern match

## Use Cases

### Real-time Masking

- Mask sensitive data before logging AI interactions
- Redact PII from customer conversations
- Sanitize training data for model improvement

### Compliance

- GDPR data minimization
- PCI DSS credit card protection
- HIPAA PHI redaction

### Audit Trail

- Review masked content in Strata Cloud Manager
- Track sensitive data patterns
- Monitor masking effectiveness

## Performance Considerations

- **Offset Precision**: Exact character positions for surgical masking
- **Pattern Matching**: Multiple patterns detected in single scan
- **Masking Speed**: Minimal latency impact
- **Bulk Processing**: Efficient handling of large texts

## Related Resources

- [API Reference]({{ site.baseurl }}/developers/api)
- [Detect Sensitive Data Loss]({{ site.baseurl }}/prisma-airs/sensitive-data-loss)
- [Overview]({{ site.baseurl }}/prisma-airs/overview)
