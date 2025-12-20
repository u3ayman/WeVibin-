# WeVibin' Server Setup Guide

## PC Server Configuration

This PC is now configured to run the WeVibin' application server.

### Server Details
- **Application**: WeVibin' - Synchronized Music & Voice Party System
- **Port**: 3001 (WebSocket + Express server)
- **Runtime**: Node.js with Express.js
- **Communication**: Socket.IO for real-time events

### Quick Start

#### Option 1: Simple Batch File (Recommended)
1. Double-click: `C:\Users\Administrator\WeVibin-\server\start-server.bat`
2. A command window will open showing "Server running on port 3001"
3. Leave the window open while the server is running

#### Option 2: Command Line
```powershell
cd "C:\Users\Administrator\WeVibin-\server"
node dist/index.js
```

#### Option 3: Development Mode with Hot Reload
```powershell
cd "C:\Users\Administrator\WeVibin-\server"
npm run dev
```

### Production Checklist

✅ **Build completed**: Server compiled to `dist/` folder
✅ **Dependencies installed**: All required npm packages in place
✅ **Startup scripts created**: Both batch and Node.js scripts available
✅ **Port 3001 configured**: Ready for client connections

### File Structure
```
server/
├── dist/
│   ├── index.js          (Main server compiled)
│   ├── rooms.js          (Room management logic)
│   ├── friends.js        (Friend system logic)
│   └── types.js          (TypeScript definitions)
├── src/
│   ├── index.ts          (Server source)
│   ├── rooms.ts
│   ├── friends.ts
│   └── types.ts
├── start-server.bat      (Windows batch launcher)
├── start-server.js       (Node.js launcher)
└── package.json
```

### Client Connection
- Desktop clients connect via WebSocket to: `ws://[SERVER-IP]:3001`
- Supports CORS from all origins (configured for flexibility)
- Real-time event handling via Socket.IO

### Logs & Monitoring
When running, the server outputs:
```
🎵 WeVibin' server running on port 3001
```

Events logged to console:
- Client connections/disconnections
- Room creation and user joins
- Voice signaling events
- Error messages

### To Create Windows Service (Advanced)

Install NSSM (Non-Sucking Service Manager):
```powershell
choco install nssm -y
```

Then create the service:
```powershell
nssm install WeVibinServer "C:\Program Files\nodejs\node.exe" "C:\Users\Administrator\WeVibin-\server\dist\index.js"
nssm set WeVibinServer AppDirectory "C:\Users\Administrator\WeVibin-\server"
nssm start WeVibinServer
```

### Restart or Stop
- To restart: Kill the command window and restart using the batch file
- Port 3001 will automatically be released

### Troubleshooting

**Port 3001 already in use:**
- Check if another server instance is running
- Use: `netstat -ano | find "3001"`
- Or kill process: `taskkill /PID [PID] /F`

**Dependencies missing:**
- Run: `cd C:\Users\Administrator\WeVibin-\server && npm install`

**Build outdated:**
- Rebuild with: `npm run build`

---

**Status**: Ready for production use ✓
