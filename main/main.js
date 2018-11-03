const { BrowserWindow, app, shell, dialog, globalShortcut, ipcMain, Menu } = require('electron');
// Module to control application life.

const path = require('path');
const url  = require('url');

const os   = require('os');

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

    mainWindow.on('closed', function () {
        mainWindow = null
    })

    var template = [{
        label: "Application",
        submenu: [
            { label: "About Application", selector: "orderFrontStandardAboutPanel:" },
            { type: "separator" },
            { label: "Quit", accelerator: "Command+Q", click: function() { app.quit(); }}
        ]}, {
        label: "Edit",
        submenu: [
            { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
            { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
            { type: "separator" },
            { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
            { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
            { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
            { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
        ]}
    ];

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createConfigWindow () {
    configWindow = new BrowserWindow({width: 800, height: 700});
    configWindow.loadURL(url.format({
        pathname : path.join(__dirname, './../renderer/html/config.html'),
        protocol : 'file:',
        slashes  : true
    }));
  // configWindow.webContents.openDevTools()
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

ipcMain.on('ipc-openDevTools', (event) => {
    mainWindow.webContents.openDevTools()
})
