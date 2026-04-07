import { app, BrowserWindow } from 'electron';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';
import http from 'http';

const isDev = process.env.NODE_ENV !== 'production';
const SERVER_PORT = 3001;
const DEV_URL = 'http://localhost:5173';
const PROD_URL = `http://localhost:${SERVER_PORT}`;

let serverProcess: ChildProcess | null = null;

// ---------------------------------------------------------------------------
// Server (production only)
// ---------------------------------------------------------------------------

function startServer(): void {
  const serverEntry = path.resolve(__dirname, '../../server/dist/server.js');

  // Spawn under system node — NOT process.execPath (Electron's binary).
  // Using Electron's binary would require better-sqlite3 to be compiled
  // against Electron's Node ABI, which is different from system Node.
  serverProcess = spawn('node', [serverEntry], {
    env: { ...process.env, NODE_ENV: 'production', PORT: String(SERVER_PORT) },
    stdio: 'inherit',
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to start server:', err);
  });
}

function waitForServer(retries = 20, interval = 300): Promise<void> {
  return new Promise((resolve, reject) => {
    function attempt(remaining: number): void {
      http
        .get(`${PROD_URL}/health`, (res) => {
          if (res.statusCode && res.statusCode < 500) {
            resolve();
          } else if (remaining > 0) {
            setTimeout(() => attempt(remaining - 1), interval);
          } else {
            reject(new Error('Server did not become ready in time'));
          }
        })
        .on('error', () => {
          if (remaining > 0) {
            setTimeout(() => attempt(remaining - 1), interval);
          } else {
            reject(new Error('Server did not become ready in time'));
          }
        });
    }
    attempt(retries);
  });
}

// ---------------------------------------------------------------------------
// Window
// ---------------------------------------------------------------------------

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadURL(isDev ? DEV_URL : PROD_URL);
}

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------

app.whenReady().then(async () => {
  if (!isDev) {
    startServer();
    await waitForServer();
  }
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('quit', () => {
  serverProcess?.kill();
});
