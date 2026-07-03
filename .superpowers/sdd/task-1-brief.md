# Task 1: Initialize Node.js project and install dependencies

**Phase:** 1 - Project Setup  
**Goal:** Create npm project structure with all required backend and frontend dependencies installed.

## Requirements

Create exactly these two files in `/Users/minal.gujar/.claude/projects/test-monitor/`:

### File 1: package.json
```json
{
  "name": "test-monitor",
  "version": "1.0.0",
  "description": "Professional test monitoring dashboard",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.0",
    "xml2js": "^0.6.2",
    "node-cron": "^3.0.2",
    "cors": "^2.8.5",
    "body-parser": "^1.20.2"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tailwindcss": "^3.3.6",
    "postcss": "^8.4.31",
    "autoprefixer": "^10.4.16"
  }
}
```

### File 2: .gitignore
```
node_modules/
package-lock.json
config.json
logs/
.env
.env.local
.DS_Store
*.log
cache/dashboard-data.json
dist/
.vite/
```

## Steps

1. **Create package.json** with exact content above
2. **Run npm install** — verify it completes without errors and creates node_modules/ and package-lock.json
3. **Create .gitignore** with exact content above
4. **Commit both files** with message: "chore: initialize Node.js project with dependencies"

## Verification

- ✓ package.json created with all exact dependencies
- ✓ npm install completed successfully
- ✓ .gitignore created with all patterns
- ✓ Both files committed to git

## Success Criteria

- `node_modules/` directory exists with dependencies installed
- `package-lock.json` exists
- Both files match specification exactly
- Git commit created with both files
