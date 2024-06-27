// receives messages from background.js service-worker
// used to send error alerts
chrome.runtime.onMessage.addListener(function (message, sender) {
    if (message.alertError) {
        alert(message.data)
    }
});

console.log("BruinLearn Downloader main script loaded on", window.location.href);