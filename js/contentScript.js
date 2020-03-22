// var blockedRoot = "";

console.log("Content script running");

chrome.extension.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log("Message action " + request.action);
        if (request.action === "geturl")
            sendResponse({URL: document.URL});
        else if (request.action === "redirect") {
            console.log('doc url', document.URL)
            window.location = chrome.extension.getURL(
                "blockedSite.html?blocked=" + request.blockedSite + '&url=' + document.URL);
        }
    });
