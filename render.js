const electron = require('electron');
const {ipcRenderer} = electron;
const fs = require("fs");
const opn = require("open");
const $ = require("jquery");
const yaml = require('js-yaml');



var serverControlSwtich = document.getElementById("serverControl");
var filePath = document.getElementById("filePath");
var msgBox = document.getElementById('errMsg');
var portNum = document.getElementById("portNum");
var resourcePath = document.getElementById("resourcePath");


var port = null;
var file = null;
var resource = null;


function openBrowser(){
    opn(`http://127.0.0.1:${port}`);
}

serverControlSwtich.addEventListener("click", (event) =>{
    console.log(event.target.checked);
    event.preventDefault();

    msgBox.style.color = "red";

    if (event.target.checked != true) { //서버가 켜져 있다면 그냥 끔.
            
        // alert("you need to be fluent in English to apply for the job");
        try{
            ipcRenderer.send('stopServer');
        }catch(err){            
            console.log(err);
        }
    }

    if( (event.target.checked == true && portNum.value.trim().length > 0) &&
        filePath.value.trim().length > 0) //파일 경로와 포트 번호가 입력 되었다면
    {
        

        try{
            if (fs.existsSync(filePath.value.trim())) {
                msgBox.innerHTML = "";                
            }else{                
                msgBox.innerHTML = "폴더 경로가 존재하지 않습니다.";
                return false;
            }

            if(portNum.value.trim().length <= 0){                
                msgBox.innerHTML = "유효한 포트번호를 입력해 주세요";
                return false;
            }else{
                console.log("send To Main");
                ipcRenderer.send('startServer', {
                    port : portNum.value.trim(),
                    file : filePath.value.trim(),
                    resourceFile : resourcePath.value.trim()
                });
                msgBox.innerHTML = "";
            }
        }catch(err){
            console.log(err);
        }
    }else{
        msgBox.innerHTML = "입력을 다시 한 번 확인해 주세요";
    }
});

ipcRenderer.on("connectReply", (event, message) => {    
    message = Number(message);
    var msgBox = document.getElementById('errMsg');

    if(message == 1){
        msgBox.style.color = "red";
        msgBox.innerHTML = "이미 사용중인 포트입니다.";
    }else if(message == 0){
        msgBox.style.color = "darkgreen";
        msgBox.innerHTML = "포트와 연결에 성공 했습니다.";

        port = portNum.value.trim();
        file = filePath.value.trim();
        resource = resourcePath.value.trim().split(",");

        serverControlSwtich.checked = true;

        document.getElementById("openBrowser").disabled = false;
    }

    
});

ipcRenderer.on("disconnectReply", (event, message) => {
    var msgBox = document.getElementById('errMsg');
    msgBox.style.color = "red";
    msgBox.innerHTML = "서버 연결이 끊어졌습니다.";
    serverControlSwtich.checked = false;
    document.getElementById('openBrowser').disabled = "disabled";
});

ipcRenderer.on('error', (event, message) => {
    console.log("receive");
    console.log("이미 사용중인 포트 입니다.") // Prints 'whoooooooh!'
});


ipcRenderer.on('fileFind', (event, message) => {
    document.getElementById("fileFind").innerHTML = "입력된 디렉토리 안에" + message + " 폴더가 존재하지 않습니다."
});


function loadConfig(){
    console.log("clicked");
    console.log(__dirname);
    try {
        const doc = yaml.safeLoad(fs.readFileSync('config.yml', 'utf8'));
        // const doc = yaml.safeLoad(fs.readFileSync(__dirname + 'config.yml', 'utf8')) //개발 환경에서는 이걸 사용
        portNum.value = doc.port;
        filePath.value = doc.file;
        resourcePath.value = doc.src;
        console.log(doc.file);
    } catch (e) {
        console.log(e);
    }
}

function saveConfig(){
    console.log(resource)
    var data = {
        port: port,
        file: file,
        src : resource
    }

    yamlStr = yaml.safeDump(data);    
    fs.writeFileSync("config.yml", yamlStr, 'utf8');
}

function controlConfigBtn(config){
    if(config == false){
        document.getElementById("loadConfig").disabled = "disabled";
        document.getElementById("saveConfig").disabled = "disabled";
    }else{
        document.getElementById("loadConfig").disabled = false;
        document.getElementById("saveConfig").disabled = false;
    }
}

/////

$("#filePath").focusout(function(){

    if(this.value.length>0){
        this.style.width = ((this.value.length + 1) * 8) + 'px';
    }else{
      this.style.width = ((this.value.length + 1) * 8) + 'px';
    }

});