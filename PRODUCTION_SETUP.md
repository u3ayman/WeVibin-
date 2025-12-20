# WeVibin' Production Server Configuration

## Server Information
- **Server Name**: MYSQL-SERVER
- **Public IP**: 41.38.46.220
- **Port**: 3001
- **Protocol**: WebSocket (Socket.IO)

## ✅ Configuration Complete

### Changes Made:
1. ✅ Server configured to listen on `0.0.0.0` (all network interfaces)
2. ✅ Client configured to connect to `41.38.46.220:3001`
3. ✅ Environment files created with production settings
4. ✅ Server rebuilt with new configuration

## 🚀 Starting the Server

### Start Production Server:
```powershell
cd C:\Users\Administrator\WeVibin-\server
node dist/index.js
```

Or double-click: `start-server.bat`

### Expected Output:
```
🎵 WeVibin' server running on 0.0.0.0:3001
📡 Server: MYSQL-SERVER
🌐 Public IP: 41.38.46.220
🔗 Clients connect to: ws://41.38.46.220:3001
```

## 🔥 Firewall Configuration Required

### Windows Firewall:
```powershell
# Allow inbound connections on port 3001
New-NetFirewallRule -DisplayName "WeVibin Server" `
  -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3001

# Allow WebRTC UDP ports for voice
New-NetFirewallRule -DisplayName "WeVibin WebRTC" `
  -Direction Inbound -Action Allow -Protocol UDP -LocalPort 49152-65535
```

### Router Port Forwarding:
Forward these ports to `192.168.X.X` (this PC's local IP):
- **TCP 3001** → Internal IP:3001
- **UDP 49152-65535** → Internal IP:49152-65535

## 📱 Client Connection

### Desktop Clients:
Clients will automatically connect to: `ws://41.38.46.220:3001`

No client-side configuration needed - the connection URL is built into the client application.

### Testing Connection:
```powershell
# Test server is accessible
Test-NetConnection -ComputerName 41.38.46.220 -Port 3001

# From external network:
curl http://41.38.46.220:3001
```

## 📁 Configuration Files

### Server (.env):
```
PORT=3001
HOST=0.0.0.0
NODE_ENV=production
SERVER_NAME=MYSQL-SERVER
PUBLIC_IP=41.38.46.220
```

### Client (.env):
```
VITE_SERVER_URL=http://41.38.46.220:3001
VITE_SERVER_NAME=MYSQL-SERVER
```

## 🔧 Troubleshooting

### Server won't start:
- Check port 3001 is not in use: `netstat -ano | findstr :3001`
- Verify firewall allows port 3001

### Clients can't connect:
1. Verify server is running: `Test-NetConnection -ComputerName 41.38.46.220 -Port 3001`
2. Check Windows Firewall rules are active
3. Verify router port forwarding is configured
4. Check if ISP blocks incoming connections on port 3001

### Find local IP for port forwarding:
```powershell
ipconfig | findstr "IPv4"
```

## 🛡️ Security Notes

- Server accepts connections from any IP (CORS: `*`)
- Consider restricting to specific client IPs if known
- WebRTC connections are peer-to-peer (not through server)
- No authentication currently implemented

---

**Status**: ✅ Ready for production deployment on MYSQL-SERVER (41.38.46.220)
