var interval;

chrome.contextMenus.create({
    "title": ".torrent To Transmission",
    "contexts": ["link"],
    "onclick": torrentOnClick,
});

/*chrome.contextMenus.create({
    "type": "separator",
    "contexts": ["link"],
    "onclick": torrentOnClick,
});

chrome.contextMenus.create({
    "title": ".torrent to Transmission2",
    "contexts": ["link"],
    "onclick": torrentOnClick,
});*/

/*
    Initial load.
*/
if (!localStorage.isInitialized) {
    localStorage.rpcUser = "";
    localStorage.rpcPass = "";
    localStorage.rpcURL = "http://localhost:9091/transmission/rpc";
    localStorage.webURL = "http://localhost:9091";
    localStorage.displayNotification = true;
    localStorage.notificationDuration = 10;
    localStorage.refreshRate = 5;
    localStorage.selected_list = "all";
    localStorage.setItem("enable-additional-paths", false);

    localStorage.isInitialized = true;
}

interval = setInterval(update, localStorage.refreshRate * 1000);

chrome.extension.onConnect.addListener(function(port) {
    if (port.name == "options") {
        port.onMessage.addListener(function(msg) {
            if (msg.method == "rpc-test") {
                rpc_request(msg.json, function(req) {
                    port.postMessage({
                        "method": "rpc-test",
                        "req": req
                    });
                }, msg.url, msg.user, msg.pass);
            }
            else if (msg.method == "reset-host") {
                resetHost();
            }
        });
    }
    else if (port.name == "list") {
        port.onMessage.addListener(function(msg) {
            if (msg.method == "rpc-call") {
                msg.json.tag = TAGNO;
                rpc_request(msg.json, function(req) {
                    update();
                    port.postMessage({
                        "method": "rpc-complete",
                        "req": req
                    });
                });
            }
        });
    }
});

function onStorageChange(event) {
    if (event.key == "refreshRate") {
        clearInterval(interval);
        interval = setInterval(update, localStorage.refreshRate * 1000);
    }
    else if (event.key == "rpcURL") {
        localStorage.sessionId = "";
        localStorage.setItem("torrents", JSON.stringify({}));
    }
}

if (window.addEventListener)
    window.addEventListener("storage", onStorageChange, false);
else
    window.attachEvent("onstorage", onStorageChange);

// reset torrents on page creation
localStorage.setItem("torrents", JSON.stringify({}));
update();
