document.addEventListener("DOMContentLoaded", () => {
    const progressBar = document.getElementById("bar");
    const progressLabel = document.getElementById('progressLabel');

    // Listen for messages from the background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.updateProgress) {
            if (message.done) { // if done, change label to complete
                progressLabel.textContent = 'Complete';
            }

            else if (message.failed) { // failed
                progressBar.style.width = "100%";
                progressBar.style.backgroundColor = "red";
                progressLabel.textContent = `Downloading unexpectedly failed. Try reloading the page and downloading again. If the issue persists, check your internet connection or report a bug to the extension Github`
            }

            else { // update progress bar
                progress = message.progress * 100 / message.max;
                progressBar.style.width = progress + "%";
                progressLabel.textContent = `Part ${message.progress} / ${message.max}`;
            }

        }
    });
});