const {app, ipcMain, Tray, BrowserWindow, nativeImage } = require('electron')
const path = require('path')

let mainWindow
let tray
let isActive = false

function createWindow () {
  const webPreferences = { nodeIntegration: true, contextIsolation: false }
  const browserConfig = { transparent: true, frame: false,  hasShadow: false, alwaysOnTop: true, skipTaskbar: true, webPreferences }
  mainWindow = new BrowserWindow(browserConfig)
  mainWindow.loadFile('index.html')
  mainWindow.hide()
  // mainWindow.webContents.openDevTools()
}

app.whenReady().then(() => {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'metronome@2x.png'))

  tray = new Tray(icon)
  createWindow()

  tray.on('click', (_event, coords) => {
    if (!isActive) {
      mainWindow.setIgnoreMouseEvents(false)
      mainWindow.webContents.send('configure', coords)
      mainWindow.maximize()
      mainWindow.show()
    } else {
      mainWindow.webContents.send('stop')
    }
    isActive = !isActive
  })

  app.dock.hide()
})

ipcMain.on('start', () => mainWindow.setIgnoreMouseEvents(true))
