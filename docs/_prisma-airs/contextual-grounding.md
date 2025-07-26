---
layout: documentation
title: Detect Contextual Grounding
description: Ensure AI outputs are grounded in context and prevent hallucinations
category: prisma-airs
---

## Overview

The contextual grounding detection ensures AI responses are grounded in the provided context, preventing hallucinations and unrelated content. Enable Contextual Grounding in the API security profile and set an Allow or Block action.

**Note**: The maximum supported size limitations are:

- Context: 100K characters
- Prompt: 10K characters
- Response: 20K characters

## The Challenge of AI Hallucinations

AI systems can generate content that is:

- **Context-Disconnected**: Responses unrelated to the provided context
- **Factually Incorrect**: Information not supported by the context
- **Topic Drift**: Straying from the subject matter
- **Fabricated Details**: Adding information not present in context
- **Logical Inconsistencies**: Contradicting the provided information

## API Example

### Request Format

The following cURL request demonstrates scanning for contextual grounding using the asynchronous endpoint:

```bash
curl -L 'https://service.api.aisecurity.paloaltonetworks.com/v1/scan/async/request' \
-H 'Content-Type: application/json' \
-H 'Accept: application/json' \
-H 'x-pan-token: <your-API-token>' \
-d '[
 {
   "req_id": 1,
   "scan_req": {
     "tr_id": "2882",
     "ai_profile": {
       "profile_name": "contextual-grounding-profile"
     },
     "metadata": {
       "app_name": "app0",
       "ai_model": "demo-model"
     },
     "contents": [
       {
         "prompt": "How long was the last touchdown?",
         "response": "The last touchdown was 15 yards",
         "context": "Hoping to rebound from their tough overtime road loss to the Raiders, the Jets went home for a Week 8 duel with the Kansas City Chiefs.  In the first quarter, New York took flight as QB Brett Favre completed an 18-yard TD pass to RB Leon Washington.  In the second quarter, the Chiefs tied the game as QB Tyler Thigpen completed a 19-yard TD pass to TE Tony Gonzalez.  The Jets would answer with Washington getting a 60-yard TD run.  Kansas City closed out the half as Thigpen completed an 11-yard TD pass to WR Mark Bradley. In the third quarter, the Chiefs took the lead as kicker Connor Barth nailed a 30-yard field goal, yet New York replied with RB Thomas Jones getting a 1-yard TD run.  In the fourth quarter, Kansas City got the lead again as CB Brandon Flowers returned an interception 91 yards for a touchdown.  Fortunately, the Jets pulled out the win with Favre completing the game-winning 15-yard TD pass to WR Laveranues Coles. During halftime, the Jets celebrated the 40th anniversary of their Super Bowl III championship team."
       }
     ]
   }
 },
 {
   "req_id": 2,
   "scan_req": {
     "tr_id": "2082",
     "ai_profile": {
       "profile_name": "contextual-grounding-profile"
     },
     "metadata": {
       "app_name": "app1",
       "ai_model": "demo-model-2"
     },
     "contents": [
       {
         "prompt": "How long was the last touchdown?",
         "response": "Salary of John Smith is $100K",
         "context": "Hoping to rebound from their tough overtime road loss to the Raiders, the Jets went home for a Week 8 duel with the Kansas City Chiefs.  In the first quarter, New York took flight as QB Brett Favre completed an 18-yard TD pass to RB Leon Washington.  In the second quarter, the Chiefs tied the game as QB Tyler Thigpen completed a 19-yard TD pass to TE Tony Gonzalez.  The Jets would answer with Washington getting a 60-yard TD run.  Kansas City closed out the half as Thigpen completed an 11-yard TD pass to WR Mark Bradley. In the third quarter, the Chiefs took the lead as kicker Connor Barth nailed a 30-yard field goal, yet New York replied with RB Thomas Jones getting a 1-yard TD run.  In the fourth quarter, Kansas City got the lead again as CB Brandon Flowers returned an interception 91 yards for a touchdown.  Fortunately, the Jets pulled out the win with Favre completing the game-winning 15-yard TD pass to WR Laveranues Coles. During halftime, the Jets celebrated the 40th anniversary of their Super Bowl III championship team."
       }
     ]
   }
 }
]'
```

### Initial Response

The asynchronous endpoint returns scan identifiers:

```json
{
    "received": "2025-05-08T12:36:58.056655917Z",
    "report_id": "R00000000-0000-0000-0000-000000000000",
    "scan_id": "00000000-0000-0000-0000-000000000000"
}
```

### Scan Results

Retrieve results using the `/v1/scan/results` endpoint with the `scan_id`:

```json
[
    {
        "req_id": 2,
        "result": {
            "action": "block",
            "category": "malicious",
            "completed_at": "2025-05-08T12:36:59Z",
            "profile_id": "00000000-0000-0000-0000-000000000000",
            "profile_name": "contextual-grounding-profile",
            "prompt_detected": {},
            "report_id": "R00000000-0000-0000-0000-000000000000",
            "response_detected": {
                "ungrounded": true
            },
            "scan_id": "00000000-0000-0000-0000-000000000000",
            "tr_id": "2082"
        },
        "scan_id": "00000000-0000-0000-0000-000000000000",
        "status": "complete"
    },
    {
        "req_id": 1,
        "result": {
            "action": "allow",
            "category": "benign",
            "completed_at": "2025-05-08T12:36:59Z",
            "profile_id": "00000000-0000-0000-0000-000000000000",
            "profile_name": "contextual-grounding-profile",
            "prompt_detected": {},
            "report_id": "R00000000-0000-0000-0000-000000000000",
            "response_detected": {
                "ungrounded": false
            },
            "scan_id": "00000000-0000-0000-0000-000000000000",
            "tr_id": "2882"
        },
        "scan_id": "00000000-0000-0000-0000-000000000000",
        "status": "complete"
    }
]
```

**Key Response Fields**:

- `response_detected.ungrounded`: `true` indicates the response is not grounded in context
- `category`: Set to `"malicious"` when ungrounded, `"benign"` when grounded
- `action`: Based on your API security profile settings

### Detailed Report

The `/v1/scan/reports` endpoint provides additional details:

```json
[
    {
        "detection_results": [
            {
                "action": "allow",
                "data_type": "response",
                "detection_service": "contextual_grounding",
                "result_detail": {},
                "verdict": "benign"
            }
        ],
        "report_id": "R00000000-0000-0000-0000-000000000000",
        "req_id": 1,
        "scan_id": "00000000-0000-0000-0000-000000000000",
        "transaction_id": "2882"
    },
    {
        "detection_results": [
            {
                "action": "block",
                "data_type": "response",
                "detection_service": "contextual_grounding",
                "result_detail": {},
                "verdict": "malicious"
            }
        ],
        "report_id": "R00000000-0000-0000-0000-000000000000",
        "req_id": 2,
        "scan_id": "00000000-0000-0000-0000-000000000000",
        "transaction_id": "2082"
    }
]
```

## Example Analysis

### Grounded Response (req_id: 1)

- **Prompt**: "How long was the last touchdown?"
- **Response**: "The last touchdown was 15 yards"
- **Verdict**: Benign - The response correctly references the 15-yard TD pass to Laveranues Coles mentioned in the context

### Ungrounded Response (req_id: 2)

- **Prompt**: "How long was the last touchdown?"
- **Response**: "Salary of John Smith is $100K"
- **Verdict**: Malicious - The response is completely unrelated to the football game context

## Use Cases

### Document Q&A Systems

- Ensure answers come from provided documents
- Prevent fabrication of information
- Maintain factual accuracy

### Customer Support

- Keep responses relevant to product documentation
- Avoid making up features or policies
- Ensure accurate technical information

### Educational Applications

- Ground responses in course materials
- Prevent misinformation in tutoring
- Maintain academic integrity

## Performance Considerations

- **Context Size**: Up to 100K characters supported
- **Asynchronous Processing**: Ideal for batch validation
- **Real-time Checks**: Use synchronous endpoint for immediate results
- **Accuracy**: High precision in detecting ungrounded content

## Related Resources

- [API Reference]({{ site.baseurl }}/developers/api)
- [Overview]({{ site.baseurl }}/prisma-airs/overview)
- [Prompt Injection Detection]({{ site.baseurl }}/prisma-airs/prompt-injection)
