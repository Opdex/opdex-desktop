import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path'
import * as url from 'url'

let win: BrowserWindow;

const args = process.argv.slice(1);
console.log(args)
const serve = args.some(val => val === '--serve');
const isTestnet = args.some(val => val === `--testnet`);

const SERVE_URL = url.format({
  pathname: path.join(__dirname, '/../../dist/opdex-desktop/index.html'),
  protocol: 'file:',
  slashes: true
});

// Allow right click inspect element during local development
require('electron-context-menu')({
  showInspectElement: serve
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // Open a window if none are open (macOS)
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.on('getNetwork', event => {
  // Network args provided must match the Network enum key in @enums
  const network = isTestnet ? 'Testnet' : 'Mainnet';
  event.sender.send('getNetworkResponse', network);
});

const createWindow = () => {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Running locally with --serve we want hot reloads
  if (serve) {
    win.webContents.openDevTools();

    // hot reloads
    require('electron-reload')(__dirname, {
      electron: require(path.join(__dirname, '/../../node_modules/electron'))
    });

    // Look to localhost
    win.loadURL('http://localhost:4200');
  }
  // else running in production
  else {
    // Load initial page
    win.loadURL(SERVE_URL);

    // Window refresh, reload home page
    win.webContents.on('did-fail-load', () => {
      console.log('did-fail-load');
      win.loadURL(SERVE_URL);
    });
  }
};
