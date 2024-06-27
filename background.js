let VIDEOURL = ""
let VIDEOFOUND = false;

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

chrome.runtime.onMessage.addListener(function (message, sender) {
    VIDEOURL = message.data;
    VIDEOFOUND = true;
    console.log(`got link ${VIDEOURL}`)
});

// handles clicked action
chrome.action.onClicked.addListener(async tab => {
    // only initiates the download if you're on bruinlearn and a sub worker has found a valid video
    if ((new URL(tab.url)).hostname == 'bruinlearn.ucla.edu' && VIDEOFOUND) {
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


            /*
             * now bruincast stores its videos in chunks of 10 seconds each...gotta download them all and merge them together
            */
            var links = []
            data.split('\n').forEach(line => {
                if (line.startsWith('media')) links.push(line)
            })
            // we're going to download the files in chunks of 10 to do better error handling
            var chunks = [];
            const chunkSize = 10;
            for (let i = 0; i < links.length; i += chunkSize) {
                chunks.push(links.slice(i, i + chunkSize));
            }
            // begin downloading
            chrome.action.setBadgeText({ text: "loading" });
            chrome.action.setBadgeBackgroundColor({ color: [0, 255, 255, 255] })
            /*
            chunks.forEach(async chunk => {
                // wait for all promises to resolve
                var responses = await Promise.all(chunk.map(link => fetch(BASEURL + link)));
                // process results
                const results = await Promise.all(
                    responses.map(response => {
                        if (!response.ok) throw new Error('failed downloading');
                        return response.blob();
                    })
                )
                console.log("processed 10")
            })
            */
            chrome.action.setBadgeText({ text: '' });

            chrome.downloads.download({
                url: "https://media.tenor.com/I52W87bM7K8AAAAi/anime-aaaa.gif",
            }, (downloadId) => {
                // Handle the response, e.g., send success or failure message
                console.log(downloadId)
            });
        } catch (err) {
            console.error(err);
            chrome.tabs.sendMessage(tab.id, { alertError: true, data: 'Error downloading video' })
        }

    }
    else {
        chrome.tabs.sendMessage(tab.id, { alertError: true, data: 'BruinCast Downloader: no BruinCast video loaded' })
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