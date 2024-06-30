let VIDEOURL = ""
let VIDEOFOUND = false;

/*
 * Following section is to set the icon to be greyed when it's not bruinlearn.ucla.edu
*/
// Function to set icon based on current tab's URL
function setIconBasedOnTab(tabId, tabUrl) {
    if (tabUrl.includes('bruinlearn.ucla.edu')) {
        chrome.action.setIcon({
            tabId: tabId,
            path: {
                "16": "images/normal.png",
                "48": "images/normal.png",
                "128": "images/normal.png"
            }
        });
    } else {
        chrome.action.setIcon({
            tabId: tabId,
            path: {
                "16": "images/grey.png",
                "48": "images/grey.png",
                "128": "images/grey.png"
            }
        });
    }
}
chrome.runtime.onInstalled.addListener(() => {
    console.log('BruinLearn Downloader installed');

    chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
        chrome.declarativeContent.onPageChanged.addRules([
            {
                conditions: [
                    new chrome.declarativeContent.PageStateMatcher({
                        pageUrl: { hostEquals: 'bruinlearn.ucla.edu' }
                    })
                ],
                actions: [new chrome.declarativeContent.ShowAction()]
            }
        ]);
    });
});
// Listener for tab updates (e.g., URL changes)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
        setIconBasedOnTab(tabId, changeInfo.url);
    }
});
// Initial setup when extension is loaded
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
        setIconBasedOnTab(tabs[0].id, tabs[0].url);
    }
});
/*
 * Now we outta chatgpt land
*/

// when a sub.js finds a valid video link, it sends it here
chrome.runtime.onMessage.addListener(function (message, sender) {
    VIDEOURL = message.data;
    VIDEOFOUND = true;
    console.log(`got link ${VIDEOURL}`)
});

// handles clicked action
chrome.action.onClicked.addListener(async tab => {
    // only initiates the download if you're on bruinlearn and a sub worker has found a valid video
    if ((new URL(tab.url)).hostname == 'bruinlearn.ucla.edu' && VIDEOFOUND) {
        // used for error handling in the catch block
        const controller = new AbortController();
        const signal = controller.signal;
        try {
            const BASEURL = VIDEOURL.substring(0, VIDEOURL.indexOf('playlist.m3u8'))
            let response = await fetch(VIDEOURL)
            let data = await response.text()

            // now the data variable holds a "playlist" object, gotta parse that and extract a "chunklist" identifier
            let chunkListID = ""
            data.split("\n").forEach(line => {
                if (line.startsWith('chunklist')) chunkListID = line;
            })

            // now need to get a "chunklist" object
            response = await fetch(BASEURL + chunkListID)
            data = await response.text()

            //now bruincast stores its videos in chunks of 10 seconds each...gotta download them all and merge them together
            var links = []
            var i = 0; // this i is used to prevent race conditions given async downloading
            data.split('\n').forEach(line => {
                if (line.startsWith('media')) links.push([i, line])
            })

            // begin downloading
            chrome.action.setBadgeText({ text: "loading" });
            chrome.action.setBadgeBackgroundColor({ color: [0, 255, 255, 255] })

            var blobs = new Array(links.length)
            // must send the downloading and ffmpeg-ing to the main.js frame because ffmpeg requires a content script
            const downloadLinks = async (links) => {
                const promises = links.map(async linkObj => {
                    // fetch
                    var response = await fetch(BASEURL + linkObj[1], { signal: signal });
                    var blob = await response.blob();
                    // slap this blob into the global array
                    blobs[linkObj[0]] = blob;
                })
                await Promise.all(promises);
            }
            await downloadLinks(links);

            // combine all the blobs into one
            var final = new Blob(blobs, { type: "video/mp2t" });
            // download
            var downloadLink = URL.createObjectURL(final) 
            chrome.downloads.download({ url: downloadLink });

            chrome.action.setBadgeText({ text: '' });            
        } catch (err) {
            console.error(err);
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                // since only one tab should be active and in the current window at once
                // the return variable should only have one entry
                var activeTab = tabs[0];
                chrome.tabs.sendMessage(activeTab.id, { alertError: true, data: 'Error downloading video' })
            });

            // clear all pending network requests
            controller.abort();
        }

    }
    else {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            // since only one tab should be active and in the current window at once
            // the return variable should only have one entry
            var activeTab = tabs[0];
            chrome.tabs.sendMessage(activeTab.id, { alertError: true, data: 'BruinCast Downloader: no BruinCast video loaded' })
        });

    }
});



/*
const { FFmpeg } = FFmpegWASM;
const { fetchFile } = FFmpegUtil;

// initialize ffmpeg
const ffmpeg = new FFmpeg();

// convert wasm and core url to absolute path
const coreUrl = chrome.runtime.getURL("lib/ffmpeg/ffmpeg-core.js");
const wasmUrl = chrome.runtime.getURL("lib/ffmpeg/ffmpeg-core.wasm");

// log ffmpeg messages
ffmpeg.on("log", ({ message }) => {
    console.log(message);
});

// progress bar
ffmpeg.on("progress", ({ progress, time }) => {
    console.log((progress * 100) + "%, time: " + (time / 1000000) + " s");
});

// custom ffmpeg command
async function runFFmpeg(inputFileName, outputFileName, commandStr, file) {
    console.log(inputFileName, outputFileName, commandStr, file);

    // exit ffmpeg if it is already loaded
    if (ffmpeg.loaded) {
        await ffmpeg.terminate();
    }

    // load ffmpeg
    await ffmpeg.load({
        coreURL: coreUrl,
        wasmURL: wasmUrl,
    });

    // split command string
    const commandList = commandStr.split(' ');
    if (commandList.shift() !== 'ffmpeg') {
        alert('Please start with ffmpeg');
        return;
    }

    // write file to filesystem
    await ffmpeg.writeFile(inputFileName, await fetchFile(file));

    // execute command
    console.log(commandList);
    await ffmpeg.exec(commandList);

    // read output file
    const data = await ffmpeg.readFile(outputFileName);

    // create blob and download
    const blob = new Blob([data.buffer]);
    console.log(blob);
    downloadFile(blob, outputFileName);
}
*/