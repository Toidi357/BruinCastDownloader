// receives messages from background.js service-worker

// used to send error alerts
chrome.runtime.onMessage.addListener(function (message, sender) {
    if (message.alertError) {
        alert(message.data)
    }
});

/*
 * used to download videos and load ffmpeg
*/
// Initialize FFmpeg WASM
async function initFFmpeg() {
    debugger;
    const { createFFmpeg, fetchFile } = FFmpeg;
    const ffmpeg = createFFmpeg({
        log: true,
        corePath: chrome.runtime.getURL('lib/ffmpeg-core.js'),
    });

    if (ffmpeg.isLoaded()) await ffmpeg.terminate();

    await ffmpeg.load();

    return ffmpeg;
}

// listen for download alerts
chrome.runtime.onMessage.addListener(async (message, sender) => {
    if (message.isDownload) {
        // used for error handling in the catch() block
        const controller = new AbortController();
        const signal = controller.signal;

        try {
            // Initialize FFmpeg WASM
            const ffmpeg = await initFFmpeg();

            const downloadLinks = async (links) => {
                const promises = links.map(async linkObj => {
                    // fetch
                    var response = await fetch(BASEURL + linkObj[1], { signal: signal });
                    var blob = await response.blob();
                    var arrayBuffer = await new Response(blob).arrayBuffer();
                    // write to FFMPEG FS
                    ffmpeg.FS('writeFile', linkObj[0] + ".ts", new Uint8Array(arrayBuffer));
                })
                await Promise.all(promises);
            }

            await downloadLinks(message.data);
            console.log('huh')

            const files = await ffmpeg.FS('readdir', '/');
            console.log(files);
        }
        catch (err) {
            // logging purposes
            console.error(err);
            alert('Error downloading video');

            // clear all pending network requests
            controller.abort();
        }
    }
})


console.log("BruinLearn Downloader main script loaded on", window.location.href);