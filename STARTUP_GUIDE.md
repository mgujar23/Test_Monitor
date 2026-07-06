# Test Monitor - Startup Guide

## Quick Start

### Option 1: Automated Startup (Easiest)

Run the startup script from terminal:
```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
./START_SERVERS.sh
```

This will:
- Start backend on **http://localhost:3000**
- Start frontend on **http://localhost:5173**
- Verify both services are responding
- Keep services running until you press Ctrl+C

### Option 2: Manual Startup (Two Terminals)

**Terminal 1 - Backend:**
```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
npm run dev:ui
```

Then open browser to: **http://localhost:5173**

---

## Server Ports

| Service | Port | URL |
|---------|------|-----|
| Backend | 3000 | http://localhost:3000 |
| Frontend | 5173 | http://localhost:5173 |
| API Base | 3000 | http://localhost:3000/api |

---

## Verification

### Check Backend
```bash
curl http://localhost:3000/api/dashboard
```

Should return JSON with test data.

### Check Frontend
```bash
curl http://localhost:5173/
```

Should return HTML with React app.

---

## Troubleshooting

### "Port already in use"
```bash
# Find process using the port
lsof -i :3000
lsof -i :5173

# Kill the process
kill -9 <PID>
```

### "Cannot GET /api/..."
- Backend is not running on port 3000
- Check that `npm run dev` is still running
- Restart backend: Press Ctrl+C and run again

### Frontend showing blank page
- Frontend is running but not loaded
- Wait 10 seconds and refresh browser
- Check browser console for errors (F12)

### "Connection refused"
- Check if services are running: `lsof -i :3000` and `lsof -i :5173`
- If not running, start them with `./START_SERVERS.sh`

---

## Production Build

To build for production:
```bash
npm run build
```

Output will be in `dist/` directory.

---

## Environment Variables

Create `.env` file if needed:
```
VITE_API_BASE=http://localhost:3000/api
DEMO_MODE=false
```

---

## Next Steps

1. Start servers: `./START_SERVERS.sh`
2. Open browser: http://localhost:5173
3. View dashboard and test features
4. Run tests: `npm test`

