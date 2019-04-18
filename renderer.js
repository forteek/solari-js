const remote = require('electron').remote,
    os = require('os');

let address = document.getElementById('address');
if (address) {
    let interfaces = os.networkInterfaces();
    let addresses = [];
    for (let k in interfaces) {
        for (let k2 in interfaces[k]) {
            let add = interfaces[k][k2];
            if (add.family === 'IPv4' && !add.internal) {
                addresses.push(add.address);
            }
        }
    }

    address.innerText = addresses[0];
}

(function handleWindowControls() {
    document.onreadystatechange = () => {
        if (document.readyState === "complete") {
            init();
        }
    };

    function init() {
        let window = remote.getCurrentWindow();
        const minButton = document.getElementById('min-button'),
            maxButton = document.getElementById('max-button'),
            restoreButton = document.getElementById('restore-button'),
            closeButton = document.getElementById('close-button');

        if (minButton) {
            minButton.addEventListener("click", event => {
                window = remote.getCurrentWindow();
                window.minimize();
            });
        }

        if (maxButton) {
            maxButton.addEventListener("click", event => {
                window = remote.getCurrentWindow();
                window.maximize();
                toggleMaxRestoreButtons();
            });

            restoreButton.addEventListener("click", event => {
                window = remote.getCurrentWindow();
                window.unmaximize();
                toggleMaxRestoreButtons();
            });

            toggleMaxRestoreButtons();
            window.on('maximize', toggleMaxRestoreButtons);
            window.on('unmaximize', toggleMaxRestoreButtons);
        }

        if (closeButton) {
            closeButton.addEventListener("click", event => {
                window = remote.getCurrentWindow();
                window.hide();
            });
        }

        function toggleMaxRestoreButtons() {
            window = remote.getCurrentWindow();
            if (window.isMaximized()) {
                maxButton.style.display = "none";
                restoreButton.style.display = "flex";
            } else {
                restoreButton.style.display = "none";
                maxButton.style.display = "flex";
            }
        }
    }
})();
