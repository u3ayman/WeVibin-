
import { app, BrowserWindow, ipcMain, dialog, clipboard } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;

// Allow self-signed certificates in development
if (process.env.NODE_ENV === 'development') {
  app.commandLine.appendSwitch('ignore-certificate-errors');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.webContents.on(
    'did-fail-load',
    (_event, errorCode, errorDescription, validatedURL) => {
      // Helpful when Electron shows a blank/white page.
      // Common causes: dev server not running, cert issues, wrong protocol.
      console.error('[did-fail-load]', { errorCode, errorDescription, validatedURL });
    }
  );

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('[render-process-gone]', details);
  });

  // Filter out harmless Chromium console errors
  mainWindow.webContents.on('console-message', (event, level, message) => {
    // Suppress harmless dragEvent errors from Chromium
    if (message.includes('dragEvent is not defined')) {
      event.preventDefault();
      return;
    }
  });

  // Handle permission requests (e.g., for microphone access)
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = ['media'];
    if (allowedPermissions.includes(permission)) {
      callback(true);
    } else {
      callback(false);
    }
  });

  // In development, load from Vite dev server
  if (process.env.NODE_ENV === 'development') {
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'https://localhost:5176';

    mainWindow.webContents.openDevTools();

    const loadWithRetry = (url: string, retryCount = 0) => {
      if (retryCount > 10) {
        console.error(`[loadURL] Failed to load ${url} after 10 retries`);
        return;
      }

      mainWindow?.loadURL(url).catch((err) => {
        console.log(`[loadURL] attempt ${retryCount + 1} failed, retrying in 2s...`);
        setTimeout(() => loadWithRetry(url, retryCount + 1), 2000);
      });
    };

    loadWithRetry(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// File picker for audio files
ipcMain.handle('select-audio-file', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Audio', extensions: ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'] }],
  });
  return result.filePaths[0];
});

// Folder picker for multiple audio files
ipcMain.handle('select-audio-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });
  if (result.filePaths.length === 0) return [];

  const folderPath = result.filePaths[0];
  const audioExtensions = ['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac'];

  try {
    const files = fs.readdirSync(folderPath);
    const audioFiles = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return audioExtensions.includes(ext);
      })
      .map(file => path.join(folderPath, file));

    return audioFiles;
  } catch (error) {
    console.error('Error reading folder:', error);
    return [];
  }
});

// Read audio file as buffer
ipcMain.handle('read-audio-file', async (_event, filePath: string) => {
  try {
    const buffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    return {
      success: true,
      buffer: Array.from(buffer),
      fileName,
      mimeType: getMimeType(filePath),
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.flac': 'audio/flac',
    '.m4a': 'audio/mp4',
    '.aac': 'audio/aac',
  };
  return mimeTypes[ext] || 'audio/mpeg';
}

export const SPOTIFY_CONFIG = {
  CLIENT_ID: '9b64bc936f434160b7e3a97ade878737',
  REDIRECT_URI: `https://localhost:5176/callback`,
  SCOPES: [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-read-playback-state',
    'user-modify-playback-state',
    'playlist-read-private',
    'playlist-read-collaborative',
    'user-library-read',
  ].join(' '),
};

export const SPOTIFY_AUTH_URL = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CONFIG.CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(SPOTIFY_CONFIG.REDIRECT_URI)}&scope=${encodeURIComponent(SPOTIFY_CONFIG.SCOPES)}`;

// Clipboard write
ipcMain.handle('write-clipboard', async (_event, text: string) => {
  try {
    clipboard.writeText(text);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

