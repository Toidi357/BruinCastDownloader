_ = ""

function checkForVideoPlayer() {
    const videoPlayerDiv = document.querySelector('div[aria-label="Video Player"]');
    if (videoPlayerDiv) {
        // this means a valid JWPlayer video was found so we're returning the ID
        // since that's how BruinCast works
        return videoPlayerDiv.id;
    } else return false;
}

const interval = setInterval(() => {
    let videoLink = checkForVideoPlayer();
    // this really bad-code variable "_" fixes the problem where the script will keep checking for video links
    // but u don't want to keep sending messages to the background worker unless the video changed
    if (videoLink != _) {
        // in my testing, all of BruinCast's links come from bclive.oid.ucla.edu
        // this helps makes sure we don't grab a random video
        try {
            if ((new URL(videoLink)).hostname === "bclive.oid.ucla.edu") {
                _ = videoLink
    
                // Send message to top frame
                chrome.runtime.sendMessage({ data: videoLink });
            }
        }
        catch (e) {
            // this means that likely an invalid videoLink was passed in
            // so we do nothing and just let it pass
        }
        
    }
}, 1000); // Check every second

// receives messages from background.js service-worker
chrome.runtime.onMessage.addListener(function (message, sender) {
    if (message.alertError) {
        alert(message.data)
    }
});