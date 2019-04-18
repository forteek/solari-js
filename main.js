const {app, BrowserWindow, Tray, Menu} = require('electron'),
    http = require('http'),
    https = require('https'),
    { exec } = require('child_process');

app.on('ready', createWindow);

let mainWindow,
    splashWindow,
    contextMenu,
    appIcon;

function createWindow () {
    splashWindow = new BrowserWindow({
        width: 500,
        height: 200,
        fullscreenable: false,
        resizable: false,
        frame: false,
        icon: 'solari.png',
        title: 'Solari'
    });

    let activeWindow = splashWindow;

    // felt kinda cute might delete later idk tho
    // mainWindow = new BrowserWindow({
    //     width: 800,
    //     height: 600,
    //     minWidth: 800,
    //     minHeight: 600,
    //     webPreferences: {
    //         nodeIntegration: true
    //     },
    //     fullscreenable: false,
    //     frame: false,
    //     show: false
    // });

    mainWindow = new BrowserWindow({
        width: 500,
        height: 200,
        fullscreenable: false,
        resizable: false,
        frame: false,
        show: false,
        icon: 'solari.png',
        title: 'Solari'
    });

    appIcon = new Tray('solari.png');

    contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show', click: () => {
                activeWindow.show()
            }
        },
        {
            label: 'Quit', click: () => {
                splashWindow = null;
                mainWindow = null;
                app.isQuiting = true;
                app.quit()
            }
        }
    ]);

    appIcon.setContextMenu(contextMenu);
    appIcon.on('double-click', () => {
        activeWindow.show();
    });

    splashWindow.loadFile('loading.html');
    splashWindow.on('close', () => {
        event.preventDefault();
        splashWindow.hide();
    });
    splashWindow.on('show', function () {
        appIcon.setHighlightMode('always')
    });

    mainWindow.loadFile('main.html');
    mainWindow.on('close', () => {
        event.preventDefault();
        mainWindow.hide();
    });
    mainWindow.on('show', function () {
        appIcon.setHighlightMode('always')
    });

    new Promise((resolve) => {
        setInterval(function () {
            exec('wmic process where "name=\'LeagueClientUx.exe\'" get ProcessId', (err, stdout, stderr) => {
                if (!stderr && !err) {
                    resolve();
                }
            });
        }, 1000)
    }).then(() => {
        activeWindow = mainWindow;
        mainWindow.show();
        splashWindow.hide();
        splashWindow = null;
        main();
    })
}

function main () {
    let port,
        pass;
    exec('wmic process where "name=\'LeagueClientUx.exe\'" get Commandline', (err, stdout, stderr) => {
        if (err) {
            throw err;
        }
        if (stderr) {
            throw stderr;
        }
        let parameters = stdout.split('" "--');
        for (let i in parameters) {
            let property = parameters[i].split('=');
            if (property[0] === "app-port") {
                port = property[1];
            } else if (property[0] === 'remoting-auth-token') {
                pass = property[1];
            }
        }
    });

    http.createServer(async function (req, res) {
        await passRequest(req, res, port, pass);
    }).listen(8069);
}

function passRequest (req, res, port, password) {
    return new Promise((resolve) => {
        let { method, url } = req;
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        }).on('end', () => {
            let options = {
                host: '127.0.0.1',
                port: port,
                path: url,
                method: method,
                rejectUnauthorized: false,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic ' + Buffer.from('riot:' + password).toString('base64')
                }
            };

            let returnBuffer = '';

            let request = https.request(options, (response) => {
                response.setEncoding('utf8');
                response.on('data', chunk => {
                    returnBuffer += chunk.toString();
                }).on('end', () => {
                    res.statusCode = response.statusCode;
                    res.statusMessage = response.statusMessage;
                    res.end(returnBuffer);
                    resolve();
                });
            });
            request.write(body);
            request.end();
        });
    })
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
});

app.on('activate', () => {
    if (mainWindow === null) createWindow()
});
