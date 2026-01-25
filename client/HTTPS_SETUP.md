# Generate Self-Signed SSL Certificates for HTTPS Development

## For Windows (PowerShell)

Run this in PowerShell as Administrator in the `client` directory:

```powershell
# Create certs directory
New-Item -ItemType Directory -Force -Path certs

# Generate certificate
$cert = New-SelfSignedCertificate -DnsName "localhost" -CertStoreLocation "Cert:\CurrentUser\My" -NotAfter (Get-Date).AddYears(1)

# Export certificate
$password = ConvertTo-SecureString -String "wevibin" -Force -AsPlainText
$cert | Export-PfxCertificate -FilePath "certs\localhost.pfx" -Password $password

# Convert to PEM format (requires OpenSSL)
# If you have OpenSSL installed:
# openssl pkcs12 -in certs\localhost.pfx -nocerts -out certs\localhost-key.pem -nodes -password pass:wevibin
# openssl pkcs12 -in certs\localhost.pfx -clcerts -nokeys -out certs\localhost.pem -password pass:wevibin
```

## Easy Method (Using mkcert - Recommended)

1. Install mkcert:
```bash
# Windows (using Chocolatey)
choco install mkcert

# Or download from: https://github.com/FiloSottile/mkcert/releases
```

2. Generate certificates:
```bash
cd client
mkdir certs
cd certs
mkcert -install
mkcert localhost
mv localhost-key.pem localhost-key.pem
mv localhost.pem localhost.pem
```

## Alternative: Use Basic Auth (No Certs)

If you don't want to deal with certificates, you can use Vite's basic HTTPS:

Edit `client/vite.config.ts`:
```typescript
server: {
  port: 5176,
  https: true,  // Simple, uses self-signed cert automatically
}
```

Then update Spotify redirect URI to: `https://localhost:5176/callback`

**Note**: Your browser will show a security warning. Click "Advanced" → "Proceed to localhost" to continue.
