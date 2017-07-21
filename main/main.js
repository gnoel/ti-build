const { BrowserWindow, app, shell, dialog, globalShortcut, ipcMain } = require('electron');
// Module to control application life.

const path = require('path');
const url  = require('url');

const os     = require('os');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let configWindow;

function createMainWindow () {
    mainWindow = new BrowserWindow({width: 1000, height: 800});
    mainWindow.loadURL(url.format({
        pathname : path.join(__dirname, './../renderer/html/renderer.html'),
        protocol : 'file:',
        slashes  : true
    }));

    globalShortcut.register('F5', () => {
        mainWindow.webContents.send('refreshF5');
    })

    globalShortcut.register('F6', () => {
        mainWindow.webContents.send('refreshF6');
    })

//   mainWindow.webContents.openDevTools()
  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

function createConfigWindow () {
    configWindow = new BrowserWindow({width: 800, height: 700});
    configWindow.loadURL(url.format({
        pathname : path.join(__dirname, './../renderer/html/config.html'),
        protocol : 'file:',
        slashes  : true
    }));
//   configWindow.webContents.openDevTools()
  configWindow.on('closed', function () {
    configWindow = null
  })
}

app.on('ready', createMainWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function () {
    if (mainWindow === null) {
        createMainWindow()
    }
});

ipcMain.on('ipc-openConfig', (event) => {
    createConfigWindow();
})
