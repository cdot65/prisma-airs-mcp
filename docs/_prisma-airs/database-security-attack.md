---
layout: documentation
title: Detect Database Security Attack
description: Detect and block database vulnerability exploits via AI prompts and responses
category: prisma-airs
---

## Overview

This detection is for AI applications using genAI models to generate database queries and regulate the types of queries generated. Enable Database Security Detection and set an Allow or Block action on the database queries in the API security profile for this detection.

## Why Database Security Detection Matters

AI systems that generate database queries can be exploited to:

- Generate malicious SQL queries
- Extract database schemas
- Bypass access controls
- Perform data exfiltration
- Execute privilege escalation
- Launch injection attacks

## API Example

### Request Format

The following cURL request demonstrates scanning for potentially malicious database queries:

```bash
curl -L 'https://service.api.aisecurity.paloaltonetworks.com/v1/scan/sync/request' \
--header 'Content-Type: application/json' \
--header 'x-pan-token: <your-API-key>' \
--header 'Accept: application/json' \
--data '{
  "tr_id": "1134",
  "ai_profile": {
    "profile_name": "ai-sec-db-security"
  },
  "metadata": {
    "app_user": "test-user-1",
    "ai_model": "Test AI model"
  },
  "contents": [
    {
      "prompt": "I need to move the customer John Green to Mars",
      "response": "This is the query to use <sql>UPDATE Customers SET City='\''Mars'\'' WHERE CustomerID=15;</sql>"
    }
  ]
}'
```

### Response Format

When a database security threat is detected, the API returns:

```json
{
    "action": "block",
    "category": "malicious",
    "profile_id": "00000000-0000-0000-0000-000000000000",
    "profile_name": "ai-sec-db-security",
    "prompt_detected": {
        "dlp": false,
        "injection": false,
        "url_cats": false
    },
    "report_id": "R00000000-0000-0000-0000-000000000000",
    "response_detected": {
        "db_security": true,
        "dlp": false,
        "url_cats": false
    },
    "scan_id": "00000000-0000-0000-0000-000000000000",
    "tr_id": "1134"
}
```

**Key Response Fields**:

- `response_detected.db_security`: `true` indicates database security threat was detected
- `category`: Set to `"malicious"` when database threat is found, `"benign"` otherwise
- `action`: Based on your API security profile settings (e.g., `"block"`)

## Detailed Scan Report

The scan report provides additional detail about the detection:

```json
[
    {
        "detection_results": [
            {
                "action": "allow",
                "data_type": "prompt",
                "detection_service": "dlp",
                "result_detail": {
                    "dlp_report": {
                        "data_pattern_rule1_verdict": "NOT_MATCHED",
                        "data_pattern_rule2_verdict": "",
                        "dlp_profile_id": "00000000",
                        "dlp_profile_name": "PII - Basic",
                        "dlp_report_id": "000008DCF2B2FA0EC57A32BB3483617365F38A6351514898258F98CE4585511F"
                    }
                },
                "verdict": "benign"
            },
            {
                "action": "allow",
                "data_type": "prompt",
                "detection_service": "pi",
                "result_detail": {},
                "verdict": "benign"
            },
            {
                "action": "allow",
                "data_type": "prompt",
                "detection_service": "uf",
                "result_detail": {
                    "urlf_report": []
                },
                "verdict": "benign"
            },
            {
                "action": "block",
                "data_type": "response",
                "detection_service": "dbs",
                "result_detail": {
                    "dbs_report": [
                        {
                            "action": "block",
                            "sub_type": "database-security-update",
                            "verdict": "malicious"
                        }
                    ]
                },
                "verdict": "malicious"
            },
            {
                "action": "allow",
                "data_type": "response",
                "detection_service": "dlp",
                "result_detail": {
                    "dlp_report": {
                        "data_pattern_rule1_verdict": "NOT_MATCHED",
                        "data_pattern_rule2_verdict": "",
                        "dlp_profile_id": "00000000",
                        "dlp_profile_name": "PII - Basic",
                        "dlp_report_id": "0000000000000000000000000000000000000000000000000000000000000000"
                    }
                },
                "verdict": "benign"
            },
            {
                "action": "allow",
                "data_type": "response",
                "detection_service": "uf",
                "result_detail": {
                    "urlf_report": []
                },
                "verdict": "benign"
            }
        ],
        "report_id": "R00000000-0000-0000-0000-000000000000",
        "req_id": 0,
        "scan_id": "00000000-0000-0000-0000-000000000000",
        "transaction_id": "1134"
    }
]
```

**Database Security Report Fields**:

- `detection_service`: `"dbs"` indicates database security detection
- `sub_type`: Specific database operation type (e.g., `"database-security-update"`)
- `verdict`: `"malicious"` when dangerous query detected

## Common Database Threat Patterns

### SQL Injection

- Classic injection: `' OR '1'='1`
- Drop table attempts: `'; DROP TABLE users; --`
- Union-based: `' UNION SELECT * FROM passwords --`
- Comment bypass: `admin'--`

### Schema Discovery

- Information schema queries
- System table enumeration
- Database structure exploration

### Data Manipulation

- UPDATE statements with broad conditions
- DELETE without WHERE clauses
- TRUNCATE operations
- Privilege escalation queries

## Use Cases

### Query Validation

- Validate AI-generated SQL before execution
- Ensure queries match expected patterns
- Prevent unauthorized data modifications

### Compliance Requirements

- PCI DSS: Protect cardholder data
- GDPR: Prevent unauthorized access
- HIPAA: Secure health records
- SOX: Maintain financial data integrity

### Security Monitoring

- Track database query patterns
- Identify anomalous behavior
- Alert on suspicious operations

## Performance Considerations

- **Real-time Detection**: Minimal latency for synchronous scanning
- **Pattern Matching**: Fast evaluation of query patterns
- **Context Analysis**: Considers both prompt and response
- **Scalable Processing**: Handles production workloads

## Related Resources

- [API Reference]({{ site.baseurl }}/developers/api)
- [Overview]({{ site.baseurl }}/prisma-airs/overview)
- [Detect Sensitive Data Loss]({{ site.baseurl }}/prisma-airs/sensitive-data-loss)
