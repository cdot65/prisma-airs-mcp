# 🎯 **Perfect Prisma AIRS Documentation Generator**

You are a senior technical documentation architect specializing in AI security platforms. You're creating the definitive GitHub Pages documentation site for **Prisma AIRS** - a comprehensive resource that will serve developers, security engineers, and enterprise teams.

## **Phase 1: Comprehensive Project Intelligence Gathering**

### **Core Project Understanding:**
1. **Foundation Analysis:**
    - Review `.claude/instructions/CLAUDE.md` for project governance and development philosophy
    - Study `.claude/plans/PLAN.md` for strategic roadmap and feature priorities
    - Analyze `PRD.md` for product vision, target audience, and business requirements
    - Extract mission and positioning from `README.md`

2. **Architecture Deep Dive:**
    - Map `src/` directory structure to understand core components and modules
    - Identify key interfaces, classes, and TypeScript patterns
    - Document data flow and integration points
    - Analyze MCP (Model Context Protocol) integration from `.claude/documentation/mcp-full-documentation.txt`

3. **API & Integration Context:**
    - Parse `.claude/context/prisma-airs-api/openapi-schema.yaml` for complete API specification
    - Study `.claude/context/prisma-airs-api/usecases.md` for real-world implementation patterns
    - Review `.claude/context/prisma-airs-api/errorcodes.md` for comprehensive error handling documentation
    - Analyze recent development context from `.claude/context/SESSION-SUMMARY-2025-07-16.md`

4. **Development Ecosystem:**
    - Review `.claude/conventions/typescript-style-guide.md` for coding standards
    - Study `.claude/conventions/linting-setup.md` for development workflow
    - Examine `package.json`, `docker-compose.yml`, and `k8s/` for deployment patterns
    - Analyze `tests/` directory for testing strategies and coverage

## **Phase 2: Strategic Documentation Architecture**

### **Multi-Audience Site Structure:**

**🚀 Developer Hub:**
- **Quick Start Guide:** Docker setup, API keys, first scan in <5 minutes
- **SDK Documentation:** Generated from `src/` TypeScript interfaces and classes
- **Code Examples:** Interactive samples from `examples/` directory with live testing
- **Integration Guides:** MCP integration, webhook setup, custom threat detection
- **API Playground:** Interactive explorer using OpenAPI schema with authentication flows

**🔒 Security Professional Portal:**
- **Threat Detection Deep Dive:** Based on use cases documentation and error codes
- **Security Policies:** Integration with `SECURITY.md` and compliance requirements
- **Incident Response:** Runbooks derived from error codes and troubleshooting patterns
- **Enterprise Deployment:** Production-ready K8s manifests and monitoring setup

**📊 Enterprise Decision Makers:**
- **Business Value:** ROI calculations, security metrics, compliance coverage
- **Architecture Overview:** High-level system diagrams and integration patterns
- **Scalability & Performance:** Based on deployment configurations and benchmarks
- **Support & SLA:** Professional support tiers and response expectations

## **Phase 3: Advanced Documentation Features**

### **Interactive & Dynamic Content:**
1. **Live API Testing Environment:**
    - Embed interactive API calls using OpenAPI schema
    - Real-time threat scanning demos with sample payloads
    - Authentication flow walkthroughs with actual API responses

2. **Code Navigation System:**
    - Searchable codebase explorer from `src/` with syntax highlighting
    - Cross-referenced documentation linking code to concepts
    - Version-controlled examples matching current codebase state

3. **Intelligent Search & Discovery:**
    - Full-text search across all documentation, code comments, and API specs
    - Tag-based filtering by use case, integration type, and audience
    - Related content recommendations based on user journey

### **Quality & Maintenance Systems:**
4. **Automated Validation:**
    - Code example execution testing in CI/CD pipeline
    - Link validation and broken reference detection
    - API documentation synchronization with actual schema

5. **Community Integration:**
    - Contribution workflows based on `CONTRIBUTING.md`
    - Issue templates linking documentation gaps to GitHub issues
    - Community examples and user-contributed content sections

## **Phase 4: Technical Implementation Excellence**

### **Site Architecture:**
- **Framework:** Jekyll/Hugo with custom plugins for API documentation
- **Hosting:** GitHub Pages with custom domain and CDN optimization
- **Performance:** <3s load times, mobile-first responsive design
- **Accessibility:** WCAG 2.1 AA compliance with screen reader optimization

### **Content Generation Strategy:**
1. **Automated API Docs:** Generate from OpenAPI schema with custom templates
2. **Code Documentation:** Extract JSDoc comments and TypeScript interfaces
3. **Tutorial Generation:** Transform `examples/` into step-by-step guides
4. **Error Reference:** Create searchable error code database from documentation
5. **Changelog Integration:** Format `CHANGELOG.md` with release highlights and migration guides

## **Phase 5: Quality Assurance & Launch Readiness**

### **Pre-Launch Checklist:**
- ✅ All code examples execute successfully against current API
- ✅ Documentation reflects actual `src/` implementation
- ✅ Consistency with `.claude/conventions/` standards maintained
- ✅ Cross-browser testing (Chrome, Firefox, Safari, Edge)
- ✅ Mobile responsiveness validated on multiple devices
- ✅ SEO optimization with proper meta tags and structured data
- ✅ Analytics integration for usage tracking and improvement

### **Success Metrics:**
- Developer time-to-first-successful-integration <15 minutes
- Documentation search finds relevant results in <3 clicks
- API error resolution time reduced by 50% through better error documentation
- Community contribution rate increased through clear contribution guidelines

## **Deliverables:**
1. **Complete GitHub Pages Site** with all sections fully populated
2. **Automated Documentation Pipeline** for ongoing maintenance
3. **Content Style Guide** for future contributions
4. **Analytics Dashboard** for measuring documentation effectiveness
5. **Community Engagement Strategy** for ongoing improvement

---

**Execute this systematically, leveraging every piece of context from the `.claude/` directories, `src/` codebase, and root project files. Create documentation that doesn't just inform—it accelerates developer success and drives Prisma AIRS adoption.**