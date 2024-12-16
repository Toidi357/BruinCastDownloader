// receives messages from background.js service-worker


chrome.runtime.onMessage.addListener(async (message, sender) => {
    // listen for download alerts
    if (message.isDownload) {
        // used for error handling in the catch block
        const controller = new AbortController();
        const signal = controller.signal;
        try {
            const blobs = new Array(message.data.length)
            const downloadLinks = async (links) => {
                const promises = links.map(async linkObj => {
                    // fetch
                    var response = await fetch(linkObj[1], { signal: signal });
                    var blob = await response.blob();
                    // slap this blob into the global array
                    blobs[linkObj[0]] = blob;
                })
                await Promise.all(promises);
            }
            await downloadLinks(message.data);

            // combine all the blobs into one
            var final = new Blob(blobs, { type: "video/mp2t" });

            // do the downloading
            var downloadLink = URL.createObjectURL(final)
            var a = document.createElement('a');
            a.href = downloadLink;
            a.download = 'video.ts'; // set file name
            document.body.appendChild(a);
            a.click();
            delete a;
        }
        catch (e) {
            console.error(e);
            alert('Error downloading video')
            // clear all pending network requests
            controller.abort();
        }
    }
})


console.log("BruinLearn Downloader main script loaded on", window.location.href);