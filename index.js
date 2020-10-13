const electron = require('electron');
const {app, BrowserWindow, ipcMain} = electron;
const path = require('path');
const url = require('url');
const fs = require('fs');
const yaml = require('js-yaml');

// Enable live reload for Electron too
// require('electron-reload')(__dirname, {
//     // Note that the path to electron may vary according to the main file
//     electron: require(`${__dirname}/node_modules/electron`)
// });

let mainWindow;

//어플리케이션 기동이 종료 후 동작한다.
app.on('ready', () => {
    createWindow();
});

function createWindow() {
    // console.log("한글");
    mainWindow = new BrowserWindow({
        width: 900,
        height: 500,
        useContentSize: true,
        title: "test",
        webPreferences: {
            nodeIntegration: true
        }

    });

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }));

    //윈도우 전부를 닫고, null로 지정한다.
    mainWindow.on('closed', () => {
        console.log("ended")
        // require('dialog').showMessageBox({
        //     message: "Close button has been pressed!",
        //     buttons: ["OK"]
        // });        
        mainWindow = null;
    });

    mainWindow.webContents.openDevTools()
}


//-- UI 통신 ---
const express = require("express");
const {response} = require("express");
const e = require('express');
const { exception } = require('console');
const serverApp = express();


var serverExist = false;
var server = null;

var sockets = {}, nextSocketId = 0;
var dirname = null;
ipcMain.on("startServer", (event, argument) => {
    console.log(argument);

    dirname = argument.file;

    try {

        serverApp.get("/", (req, res) => {
            res.sendFile(dirname + "/main.html");
        })

        serverApp.use('/css', express.static(dirname + '/css'));
        serverApp.use('/js', express.static(dirname + '/js'));

        if(argument.resourceFile.length > 0){
            var noFileArr = [];
            resourceFileArr = argument.resourceFile.split(",");
            for(src of resourceFileArr){
                src = src.trim();
                if( fs.existsSync(dirname + src) ){
                    serverApp.use(src, express.static(dirname + src));
                }else{
                    noFileArr.push(src);
                }
            }

            if(noFileArr.length > 0){
                mainWindow.webContents.send("fileFind", noFileArr);
            }
        }

        server = serverApp.listen(argument.port, () => {
            console.log('The server is running on Prt ', argument.port);
            event.reply("connectReply", 0);
        });

        

        // Create a new server on port 4000

        // Maintain a hash of all connected sockets
        server.on('error', function (err) {
            if (err.code === 'EADDRINUSE') {
                mainWindow.webContents.send("connectReply", 1);
                console.log(err);
            }else{
                console.log(err);
            }
            
        });

        server.on('connection', function (socket) {
            // Add a newly connected socket
            var socketId = nextSocketId++;
            sockets[socketId] = socket;
            console.log('socket', socketId, 'opened');

            // Remove the socket when it closes
            socket.on('close', function () {
                console.log('socket', socketId, 'closed');
                delete sockets[socketId];
            });

            // Extend socket lifetime for demo purposes
            // socket.setTimeout(4000);
        });

        

        serverExist = true;
    }catch(err){
        console.log(err);
    }
});

ipcMain.on("stopServer", (event, argument) => {    
    try {
        
        
        // Close the server
        server.close(function () {
            console.log('Server closed!');
            mainWindow.webContents.send("disconnectReply");
        });
        // Destroy all open sockets
        for (var socketId in sockets) {
            console.log('socket', socketId, 'destroyed');
            sockets[socketId].destroy();
        }

        server = null;
    }catch(e){
        console.log(e);
        console.log("close error");
    }
});





// const { app, BrowserWindow } = require('electron')

// function createWindow () {
//   // 브라우저 창을 생성합니다.
//   const win = new BrowserWindow({
//     width: 800,
//     height: 600,
//     webPreferences: {
//       nodeIntegration: true
//     }
//   })

//   win.loadURL(url.format({
//     pathname: path.join(__dirname, 'index.html'),
//     protocol: 'file:',
//     slashes: true
//   }))

//   // and load the index.html of the app.
//   win.loadFile('index.html')

//   // 개발자 도구를 엽니다.
//   win.webContents.openDevTools()
// }

// // 이 메소드는 Electron의 초기화가 완료되고
// // 브라우저 윈도우가 생성될 준비가 되었을때 호출된다.
// // Some APIs can only be used after this event occurs.
// app.whenReady().then(createWindow)

// // Quit when all windows are closed, except on macOS. There, it's common
// // for applications and their menu bar to stay active until the user quits
// // explicitly with Cmd + Q.
// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') {
//     app.quit()
//   }
// })

// app.on('activate', () => {
//   // On macOS it's common to re-create a window in the app when the
//   // dock icon is clicked and there are no other windows open.
//   if (BrowserWindow.getAllWindows().length === 0) {
//     createWindow()
//   }
// })

// // 이 파일에는 나머지 앱의 특정 주요 프로세스 코드를 포함시킬 수 있습니다