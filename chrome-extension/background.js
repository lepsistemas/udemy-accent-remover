chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type === "synthesizeSpeech") {
        fetch('https://udemy-accent-remover-production.up.railway.app/synthesize-speech', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: request.text })
        })
        .then(response => response.blob())
        .then(blob => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = function() {
                const base64data = reader.result;
                sendResponse({ success: true, audioBase64: base64data });
            }
        })
        .catch(error => {
            console.error('Error fetching audio:', error);
            sendResponse({ success: false, error: error.toString() });
        });
        return true;  // Indicates that the response is asynchronous
    }
});
