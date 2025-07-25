/**
 * Example SSE Client for testing Streamable HTTP transport
 */

/* eslint-env node */
/* global fetch, setTimeout */

const EventSource = require('eventsource');

// Configuration
const SERVER_URL = 'http://localhost:3000';
const SESSION_ID = 'test-session-123';

// Test SSE connection
async function testSSEConnection() {
  console.log('Testing SSE connection to MCP server...\n');

  // Create EventSource with headers
  const eventSource = new EventSource(SERVER_URL, {
    headers: {
      'Accept': 'text/event-stream',
      'Mcp-Session-Id': SESSION_ID,
    },
  });

  // Handle connection open
  eventSource.onopen = () => {
    console.log('✅ SSE connection established');
  };

  // Handle generic messages
  eventSource.onmessage = (event) => {
    console.log('📨 Message received:', event.data);
  };

  // Handle specific event types
  eventSource.addEventListener('connect', (event) => {
    console.log('🔗 Connect event:', event.data);
  });

  eventSource.addEventListener('endpoint', (event) => {
    console.log('🎯 Endpoint event:', event.data);
  });

  eventSource.addEventListener('message', (event) => {
    console.log('💬 JSON-RPC message:', event.data);
  });

  eventSource.addEventListener('notification', (event) => {
    console.log('🔔 Notification:', event.data);
  });

  // Handle errors
  eventSource.onerror = (error) => {
    console.error('❌ SSE error:', error);
    eventSource.close();
  };

  // Test sending a request that might trigger streaming
  setTimeout(async () => {
    console.log('\n📤 Sending test request with SSE support...');
    
    try {
      const response = await fetch(SERVER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          'Mcp-Session-Id': SESSION_ID,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/list',
          params: {},
          id: 1,
        }),
      });

      if (response.headers.get('content-type')?.includes('text/event-stream')) {
        console.log('✅ Server returned SSE stream');
        // In a real implementation, we'd handle the SSE stream here
      } else {
        const data = await response.json();
        console.log('📨 Standard JSON response:', JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.error('❌ Request error:', error);
    }
  }, 2000);

  // Close connection after 10 seconds
  setTimeout(() => {
    console.log('\n👋 Closing SSE connection...');
    eventSource.close();
    process.exit(0);
  }, 10000);
}

// Run the test
testSSEConnection().catch(console.error);