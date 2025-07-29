---
layout: home
title: Prisma AIRS MCP - AI Runtime Security
description: Enterprise-grade AI security through Model Context Protocol integration
---

<div class="hero-section">
  <h1 class="hero-title">Prisma AIRS MCP</h1>
  <p class="hero-subtitle">Secure Your AI Applications with Enterprise-Grade Runtime Protection</p>
  <div class="hero-buttons">
    <a href="{{ site.baseurl }}/deployment/quickstart" class="btn btn-primary">Get Started</a>
    <a href="{{ site.baseurl }}/developers/api/" class="btn btn-secondary">API Reference</a>
  </div>
</div>

<div class="features-grid">
  <div class="feature-card">
    <div class="feature-icon">🚀</div>
    <h3>Quick Start In Minutes</h3>
    <p>Docker-based setup with Claude Desktop integration. Get your first security scan running in minutes.</p>
    <a href="{{ site.baseurl }}/deployment/quickstart/">Quick Start Guide →</a>
  </div>
  
  <div class="feature-card">
    <div class="feature-icon">🔒</div>
    <h3>Prisma AIRS</h3>
    <p>Detect prompt injections, malicious code, data leaks, and more with Palo Alto Networks' proven security engine.</p>
    <a href="{{ site.baseurl }}/prisma-airs/">Security Features →</a>
  </div>
  
  <div class="feature-card">
    <div class="feature-icon">🏢</div>
    <h3>Enterprise Ready</h3>
    <p>Production-grade Kubernetes deployment with monitoring, scaling, and compliance features.</p>
    <a href="{{ site.baseurl }}/deployment/kubernetes/">Kubernetes Guide →</a>
  </div>
</div>

<div class="container">
  <section class="content-section">
    <h2>What is Prisma AIRS MCP?</h2>
    <div class="content-text">
      <p>Prisma AIRS MCP is a Model Context Protocol (MCP) server that seamlessly integrates Palo Alto Networks' Prisma AIRS (AI Runtime Security) with AI applications like Claude. It provides real-time security scanning, threat detection, and compliance enforcement for AI-generated content.</p>
    </div>
    
    <h3>Key Capabilities</h3>
    <ul class="capabilities-list">
      <li><strong>🛡️ Real-time Threat Detection</strong>: Scan prompts and responses for security threats</li>
      <li><strong>🔍 Comprehensive Analysis</strong>: Detect prompt injections, malicious code, data leaks, and more</li>
      <li><strong>⚡ High Performance</strong>: Sub-second scanning with intelligent caching</li>
      <li><strong>🔧 Easy Integration</strong>: Standard MCP protocol with TypeScript SDK</li>
      <li><strong>📊 Enterprise Features</strong>: Monitoring, scaling, and compliance tools</li>
      <li><strong>🐳 Container Ready</strong>: Docker and Kubernetes deployment options</li>
    </ul>
  </section>

  <section class="content-section">
    <h2>Latest Updates</h2>
    
    <div class="update-block">
      <h3>Version 1.0.3 - Bug Fix Release</h3>
      <p><em>Released: July 28, 2025</em></p>
      <ul>
        <li>Fixed cache key generation to properly deduplicate identical scan requests</li>
        <li>Improved performance by serving cached results for repeated scans</li>
        <li>Added comprehensive unit tests for cache functionality</li>
      </ul>
    </div>
    
    <div class="update-block">
      <h3>Version 1.0.0 - Initial Release</h3>
      <p><em>Released: July 27, 2025</em></p>
      <ul>
        <li>Full MCP Protocol support with tools, resources, and prompts</li>
        <li>Complete Prisma AIRS integration for AI security scanning</li>
        <li>Built-in caching and rate limiting for performance</li>
        <li>Docker and Kubernetes deployment options</li>
      </ul>
    </div>
    
    <p><a href="{{ site.baseurl }}/developers/release-notes/">View all release notes →</a></p>
  </section>
</div>

<div class="cta-section">
  <h2>Ready to Secure Your AI?</h2>
  <p>Get started with Prisma AIRS MCP in minutes</p>
  <a href="{{ site.baseurl }}/deployment/quickstart" class="btn btn-large btn-primary">Start Building →</a>
</div>
