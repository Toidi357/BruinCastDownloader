// receives messages from background.js service-worker


chrome.runtime.onMessage.addListener(async (message, sender) => {
    // listen for download alerts
    if (message.isDownload) {
        // used for error handling in the catch block
        const controller = new AbortController();
        const signal = controller.signal;
        try {
            // allocate array to put our video parts in
            const blobs = new Array(message.data.length)

            // counter for our progress bar
            var i = 1;

            // function that downloads all the parts, may not come in order so have to handle accordingly
            const downloadLinks = async (links) => {
                const promises = links.map(async linkObj => {
                    // fetch
                    var response = await fetch(linkObj[1], { signal: signal });
                    var blob = await response.blob();
                    // slap this blob into the global array
                    blobs[linkObj[0]] = blob;

                    // send message to our progress bar
                    chrome.runtime.sendMessage({
                        updateProgress: true,
                        progress: i,
                        max: blobs.length,
                        done: false,
                        failed: false,
                    })
                    i++;
                })
                await Promise.all(promises);
            }
            await downloadLinks(message.data);

            // let our progress bar we're finished
            chrome.runtime.sendMessage({
                updateProgress: true,
                done: true,
            })

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

            // let our progress bar know of the failure
            chrome.runtime.sendMessage({
                updateProgress: true,
                failed: true,
            })
        }
    }
})


console.log("BruinLearn Downloader main script loaded on", window.location.href);