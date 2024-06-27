var isTop = true;
chrome.runtime.onMessage.addListener(function (details) {
    // let background.js know that a valid video has been found
    console.log(details)
});

console.log("BruinLearn Downloader main script loaded on", window.location.href);


