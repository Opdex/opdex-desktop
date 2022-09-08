import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as logger from 'electron-log';
import * as path from 'path'
import * as url from 'url'

let win: BrowserWindow;

// Command line arguments
const args = process.argv.slice(1);
const serve = args.some(val => val.includes('serve'));
const isTestnet = args.some(val => val.includes('testnet'));

const SERVE_URL = url.format({
  pathname: path.join(__dirname, '../../dist/opdex-desktop/index.html'),
  protocol: 'file:',
  slashes: true
});

// Allow right click inspect element during local development
require('electron-context-menu')({
  showInspectElement: serve
});

////////////////////////////////////
//  APP State                     //
////////////////////////////////////

app.whenReady().then(() => {
  createWindow();

  // Open browser links in new window
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

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

app.on('activate', () => {
  // On Mac it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (!win) createWindow();
});

////////////////////////////////////
//  IPC Calls                     //
////////////////////////////////////

ipcMain.on('getNetwork', event => {
  // Network args provided must match the Network enum key in @enums
  const network = isTestnet ? 'Testnet' : 'Mainnet';
  event.sender.send('getNetworkResponse', network);
});

ipcMain.on('log', (event: any, arg: any) => {
  logger[arg.level](arg.data);
});

////////////////////////////////////
//  Private helper methods        //
////////////////////////////////////

const createWindow = () => {
  setupLogger();

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
      electron: require(path.join(__dirname, '../../node_modules/electron'))
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

const setupLogger = () => {
  logger.transports.file.level = 'info';

  const d = new Date();
  const dateString = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

  // Linux: ~/.config/{app name}/logs/{process type}.log
  // macOS: ~/Library/Logs/{app name}/{process type}.log
  // Windows: %USERPROFILE%\AppData\Roaming\{app name}\logs\{process type}.log
  logger.transports.file.fileName = `${dateString}.log`;
}
