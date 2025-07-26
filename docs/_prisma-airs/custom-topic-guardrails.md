---
layout: documentation
title: Custom Topic Guardrails
description: Define and enforce custom rules to block or allow topics based on your needs
category: prisma-airs
---

## Overview

Custom topic guardrails allow you to detect and block content that violates your configured topic policies. Enable Custom Topic Guardrails in your API security profile with Allow or Block actions.

## Why Custom Guardrails?

Every organization has unique requirements:

- **Industry Regulations**: Sector-specific compliance
- **Company Policies**: Internal guidelines and values
- **Brand Protection**: Maintaining reputation
- **Legal Requirements**: Jurisdiction-specific rules
- **Competitive Advantage**: Protecting trade secrets
- **Cultural Sensitivity**: Regional considerations

## API Example

### Request Format

The following cURL request demonstrates using custom topic guardrails to detect policy violations:

```bash
curl -L 'https://service.api.aisecurity.paloaltonetworks.com/v1/scan/sync/request' \
--header 'Content-Type: application/json' \
--header 'x-pan-token: <your-API-token>' \
--header 'Accept: application/json' \
--data '{
  "tr_id": "1111",
  "ai_profile": {
    "profile_name": "custom-topic-guardrails-profile"
  },
  "metadata": {
    "app_user": "test-user-1",
    "ai_model": "Test AI model"
  },
    "contents": [
        {
            "prompt": "The exploration of Mars is driven by a multifaceted scientific curiosity. Primarily, scientists are interested in understanding Mars past habitability, searching for signs of past or present life, investigating the planet s geological evolution, and studying its climate and atmosphere. These studies can provide valuable insights into the formation and evolution of rocky planets in general, including our own Earth.  Furthermore, Mars offers a potential backup location for humanity should Earth become uninhabitable in the distant future. However, numerous technological hurdles impede human missions to Mars. These include the long duration of the journey 6-8 months each way, which exposes astronauts to prolonged radiation and the psychological effects of isolation. Developing reliable life support systems capable of functioning for years in a harsh environment poses a significant challenge. Landing heavy payloads safely on Mars is another obstacle, as is developing technologies for in-situ resource utilization ISRU to create propellant for the return trip, minimize mission mass, and build habitats. The potential health risks to astronauts from Martian dust, radiation, and low gravity also need further investigation and mitigation strategies",
           "response": "The exploration of Mars is driven by a multifaceted scientific curiosity. Primarily, scientists are interested in understanding Mars past habitability, searching for signs of past or present life, investigating the planet s geological evolution, and studying its climate and atmosphere. These studies can provide valuable insights into the formation and evolution of rocky planets in general, including our own Earth.  Furthermore, Mars offers a potential \"backup location\" for humanity should Earth become uninhabitable in the distant future.\n\nHowever, numerous technological hurdles impede human missions to Mars. These include the long duration of the journey (6-8 months each way), which exposes astronauts to prolonged radiation and the psychological effects of isolation. Developing reliable life support systems capable of functioning for years in a harsh environment poses a significant challenge. Landing heavy payloads safely on Mars is another obstacle, as is developing technologies for in-situ resource utilization (ISRU) to create propellant for the return trip, minimize mission mass, and build habitats. The potential health risks to astronauts from Martian dust, radiation, and low gravity also need further investigation and mitigation strategies."
        }
    ]
}'
```

### Response Format

When a topic violation is detected, the API returns:

```json
{
    "action": "block",
    "category": "malicious",
    "profile_id": "00000000-0000-0000-0000-000000000000",
    "profile_name": "custom-topic-guardrail",
    "prompt_detected": {
        "topic_violation": true
    },
    "prompt_detection_details": {
        "topic_guardrails_details": {
            "blocked_topics": ["Astronomy and outer space exploration"]
        }
    },
    "report_id": "R00000000-0000-0000-0000-000000000000",
    "response_detected": {
        "topic_violation": true
    },
    "response_detection_details": {
        "topic_guardrails_details": {
            "blocked_topics": ["Astronomy and outer space exploration"]
        }
    },
    "scan_id": "00000000-0000-0000-0000-000000000000",
    "tr_id": "1111"
}
```

**Key Response Fields**:

- `prompt_detected.topic_violation`: `true` indicates topic violation in prompt
- `response_detected.topic_violation`: `true` indicates topic violation in response
- `topic_guardrails_details.blocked_topics`: Array of violated blocked topics
- `category`: Set to `"malicious"` when topic violations are found

### Detailed Report

The scan report provides additional details about the topic violation:

```json
[
    {
        "detection_results": [
            {
                "action": "block",
                "data_type": "prompt",
                "detection_service": "topic_guardrails",
                "result_detail": {
                    "topic_guardrails_report": {
                        "allowed_topic_list": "not_matched",
                        "blockedTopics": [
                            "Astronomy and outer space exploration"
                        ],
                        "blocked_topic_list": "matched"
                    }
                },
                "verdict": "malicious"
            },
            {
                "action": "block",
                "data_type": "response",
                "detection_service": "topic_guardrails",
                "result_detail": {
                    "topic_guardrails_report": {
                        "allowed_topic_list": "not_matched",
                        "blockedTopics": [
                            "Astronomy and outer space exploration"
                        ],
                        "blocked_topic_list": "matched"
                    }
                },
                "verdict": "malicious"
            }
        ],
        "report_id": "R00000000-0000-0000-0000-000000000000",
        "req_id": 0,
        "scan_id": "00000000-0000-0000-0000-000000000000",
        "transaction_id": "1111"
    }
]
```

**Report Fields**:

- `allowed_topic_list`: Whether content matches allowed topics ("matched" or "not_matched")
- `blocked_topic_list`: Whether content matches blocked topics ("matched" or "not_matched")
- `blockedTopics`: List of specific blocked topics that were detected

## Configuration Types

### Blocked Topics

Topics that should be prevented in prompts and responses:

- Competitor information
- Unreleased products
- Internal processes
- Sensitive company data

### Allowed Topics

Topics that are explicitly permitted:

- Public product information
- General customer support
- Educational content
- Published documentation

## Common Use Cases

### Enterprise Security

- Block discussion of competitor strategies
- Prevent leakage of confidential projects
- Restrict access to internal procedures
- Control financial information disclosure

### Industry Compliance

- Healthcare: Block medical advice
- Financial: Prevent investment recommendations
- Legal: Restrict legal counsel
- Education: Enforce age-appropriate content

### Brand Protection

- Control messaging about products
- Prevent unauthorized announcements
- Maintain consistent communication
- Protect trade secrets

## Topic Detection

### How It Works

1. Content is analyzed for topic matches
2. Both allowed and blocked lists are checked
3. Blocked topics take precedence
4. Violations trigger configured actions

### Detection Precision

- Semantic understanding of topics
- Context-aware matching
- Multi-language support
- Configurable sensitivity levels

## Performance Considerations

- **Real-time Scanning**: Synchronous detection for immediate protection
- **Topic Matching**: Fast semantic analysis
- **Dual Detection**: Both prompts and responses analyzed
- **Scalable**: Handles complex topic hierarchies

## Related Resources

- [API Reference]({{ site.baseurl }}/developers/api)
- [Overview]({{ site.baseurl }}/prisma-airs/overview)
