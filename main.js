const {app, BrowserWindow} = require('electron'),
    fs = require('fs'),
    http = require('http'),
    https = require('https');

app.on('ready', createWindow);

let mainWindow,
    splashWindow;

function createWindow () {
    splashWindow = new BrowserWindow({
        width: 500,
        height: 200,
        fullscreenable: false,
        resizable: false,
        frame: false
    });

    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: true
        },
        fullscreenable: false,
        frame: false,
        show: false
    });

    splashWindow.loadFile('loading.html');
    splashWindow.on('closed', () => {
        splashWindow = null;
        if (!mainWindow.isVisible()) {
            mainWindow.close();
        }
    });

    mainWindow.loadFile('index.html');
    mainWindow.on('closed', () => {
        mainWindow = null
    });

    new Promise((resolve, reject) => {
        setInterval(function () {
            fs.access('C:/Riot Games/League of Legends/lockfile', fs.constants.R_OK, function (err) {
                if (!err) {
                    resolve();
                }
            });
        }, 1000)
    }).then(() => {
        mainWindow.show();
        splashWindow.close();
        main();
    })
}

function main () {
    let port,
        pass;
    fs.readFile('C:/Riot Games/League of Legends/lockfile', 'utf-8', (err, data) => {
        if (err) {
            throw err;
        }
        data = data.split(":");

        port = data[2];
        pass = data[3];
    });

    http.createServer(function (req, res) {
        new Promise((resolve) => {
            let passedResponse = passRequest(req, res, port, pass);
            setInterval(() => {
                if (passedResponse) {
                    console.log(3);
                    resolve(passedResponse)
                }
            }, 200);
        }).then((value) => {
            console.log(4);
            res.statusCode = value.statusCode;
            res.write('super');
            res.end();
        });
    }).listen(8069);
}

function passRequest (req, res, port, password) {
    let { method, url } = req;
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    }).on('end', () => {
        res.end();
    });

    let options = {
        host: '127.0.0.1',
        port: port,
        path: url,
        mathod: method,
        rejectUnauthorized: false,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + Buffer.from('riot:' + password).toString('base64')
        }
    };

    let returnBuffer,
        returnDict = {};
    new Promise((resolve) => {
        let request = https.request(options, res => {
            res.setEncoding('utf8');
            res.on('data', chunk => {
                returnBuffer += chunk.toString();
            }).on('end', () => {
                returnDict = {
                    statusCode: res.statusCode,
                    statusMessage: res.statusMessage,
                    body: returnBuffer
                };
                console.log(1);
                resolve();
            });
        });
        request.write(body);
        request.end();
    }).then(() => {
        console.log(2);
        return returnDict;
    });
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
});

app.on('activate', () => {
    if (mainWindow === null) createWindow()
});
