const electron = require('electron');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const path = require('path');
const url  = require('url');

const shell = require('electron').shell;

const os     = require('os');
const dialog = require('electron').dialog;
const ipc    = require('electron').ipcMain;


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let configWindow;
//console.log( app.getPath( 'userData'))

function createMainWindow () {
    mainWindow = new BrowserWindow({width: 1000, height: 800});
    mainWindow.loadURL(url.format({
        pathname : path.join(__dirname, './../renderer/html/renderer.html'),
        protocol : 'file:',
        slashes  : true
    }));
  //mainWindow.webContents.openDevTools()
  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

function createConfigWindow () {
    mainWindow = new BrowserWindow({width: 800, height: 700});
    mainWindow.loadURL(url.format({
        pathname : path.join(__dirname, './../renderer/html/config.html'),
        protocol : 'file:',
        slashes  : true
    }));
  //mainWindow.webContents.openDevTools()
  mainWindow.on('closed', function () {
    mainWindow = null
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

ipc.on('ipc-openConfig', (event) => {
    createConfigWindow();
})
