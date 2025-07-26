# Traefik Configuration Validation

## DNS Configuration ✅

- **Domain**: airs.cdot.io
- **IP Address**: 10.0.0.220
- **DNS Server**: 10.0.0.70

Your DNS is correctly configured to point `airs.cdot.io` to the Traefik LoadBalancer IP `10.0.0.220`.

## Traefik IngressRoute Configuration ✅

### TLS Termination

- **Port**: 443 (HTTPS/websecure entrypoint)
- **Certificate**: Using wildcard certificate `wildcard-cdot-io-tls`
- **TLS Termination**: Yes, at Traefik level

### Routing Rules

- **Host Match**: `airs.cdot.io`
- **Path Match**: `/prisma-airs`
- **Path Stripping**: Yes, removes `/prisma-airs` before forwarding
- **Target Service**: `prisma-airs-mcp` on port 80

### Traffic Flow

1. Client connects to `https://airs.cdot.io/prisma-airs` (port 443)
2. DNS resolves to Traefik LoadBalancer at `10.0.0.220`
3. Traefik terminates TLS using wildcard certificate
4. Traefik matches the IngressRoute rule for host `airs.cdot.io` and path `/prisma-airs`
5. Traefik applies middlewares:
    - Strips `/prisma-airs` prefix
    - Adds security headers
    - Applies rate limiting (production only)
6. Traefik forwards request to `prisma-airs-mcp` service on port 80
7. Service routes to MCP pod on port 3000

## Configuration Details

### IngressRoute

```yaml
spec:
    entryPoints:
        - websecure # Port 443
    routes:
        - match: Host(`airs.cdot.io`) && PathPrefix(`/prisma-airs`)
          services:
              - name: prisma-airs-mcp
                port: 80
          middlewares:
              - name: prisma-airs-mcp-stripprefix # Removes /prisma-airs
              - name: prisma-airs-mcp-headers # Security headers
    tls:
        secretName: wildcard-cdot-io-tls # Your wildcard cert
```

### Service Configuration

```yaml
spec:
    type: ClusterIP
    selector:
        app: prisma-airs-mcp
    ports:
        - name: http
          port: 80 # Service port
          targetPort: http # Maps to container port 3000
```

## Testing Commands

### 1. Verify Traefik LoadBalancer IP

```bash
kubectl get svc -n traefik traefik -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
# Should return: 10.0.0.220
```

### 2. Test DNS Resolution

```bash
nslookup airs.cdot.io
# Should resolve to: 10.0.0.220
```

### 3. Test HTTPS Endpoint

```bash
# Test the health endpoint
curl -k https://airs.cdot.io/prisma-airs/health

# With verbose output to see TLS handshake
curl -kv https://airs.cdot.io/prisma-airs/health
```

### 4. Verify Certificate

```bash
# Check certificate details
openssl s_client -connect airs.cdot.io:443 -servername airs.cdot.io < /dev/null | openssl x509 -text | grep -E "(Subject:|DNS:)"
```

### 5. Check IngressRoute Status

```bash
kubectl get ingressroute prisma-airs-mcp -n prisma-airs -o yaml
```

## Expected Behavior

When you access `https://airs.cdot.io/prisma-airs`:

1. ✅ TLS connection established on port 443
2. ✅ Certificate validates for `*.cdot.io`
3. ✅ Request routed to MCP server
4. ✅ Path `/prisma-airs` stripped, so MCP receives request at `/`
5. ✅ MCP server responds on port 3000

## Troubleshooting

### If TLS is not working:

1. Verify the secret exists: `kubectl get secret wildcard-cdot-io-tls -n prisma-airs`
2. Check Traefik logs: `kubectl logs -n traefik deployment/traefik`

### If routing is not working:

1. Check IngressRoute: `kubectl describe ingressroute prisma-airs-mcp -n prisma-airs`
2. Verify service endpoints: `kubectl get endpoints prisma-airs-mcp -n prisma-airs`

### If DNS is not resolving:

1. Verify Traefik has the LoadBalancer IP: `kubectl get svc -n traefik`
2. Check DNS propagation: `dig airs.cdot.io @10.0.0.70`

## Summary

Your configuration is correct for:

- ✅ DNS pointing to Traefik at 10.0.0.220
- ✅ TLS termination on port 443 with wildcard certificate
- ✅ Path `/prisma-airs` routing to MCP pods
- ✅ Path stripping so MCP receives clean paths
- ✅ Security headers and rate limiting
