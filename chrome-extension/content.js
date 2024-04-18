let currentSubtitle = '';
let synthesisEnabled = false;

// Fetch the initial state from storage.
chrome.storage.sync.get('synthesisEnabled', data => {
    synthesisEnabled = !!data.synthesisEnabled;
    console.log('Initial synthesis state fetched:', synthesisEnabled);
    applyVideoSettings();
    setupSubtitleObserver();
});

// Listen for toggle changes from the popup.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'toggleSynthesis') {
        synthesisEnabled = message.enabled;
        console.log('Synthesis toggled. Now enabled:', synthesisEnabled);
        applyVideoSettings();
        setupSubtitleObserver();  // Re-check and re-attach the observer on toggle
    }
});

function applyVideoSettings() {
    const videoElement = document.querySelector('video');
    if (videoElement) {
        muteVideo(videoElement, synthesisEnabled);
    }
}

function fetchAndPlayAudio(text) {
    if (!synthesisEnabled || !text) return;
    console.log('Fetching audio for:', text);
    fetch('https://udemy-accent-remover-production.up.railway.app/synthesize-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text })
    })
    .then(response => response.blob())
    .then(blob => {
        playAudio(URL.createObjectURL(blob));
    })
    .catch(error => {
        console.log('Error fetching synthesized audio:', error);
    });
}

function playAudio(audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play().then(() => {
        console.log('AI-generated audio is playing.');
    }).catch(error => {
        console.error('Error playing synthesized audio:', error);
    });
}

function muteVideo(element, mute) {
    element.muted = mute;
}

function setupSubtitleObserver() {
    const subtitleContainer = document.querySelector('.captions-display--captions-container--PqdGQ');
    if (!subtitleContainer) {
        console.log('No stable subtitle container found, retrying in 1 second...');
        setTimeout(setupSubtitleObserver, 1000);
        return;
    }
    console.log('Stable subtitle container found:', subtitleContainer);
    observeSubtitles(subtitleContainer);
}

function observeSubtitles(container) {
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList' && mutation.addedNodes.length) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE && node.matches('[data-purpose="captions-cue-text"]')) {
                        processSubtitleNode(node);
                    }
                });
            } else if (mutation.type === 'characterData' && mutation.target.parentNode.matches('[data-purpose="captions-cue-text"]')) {
                processSubtitleNode(mutation.target.parentNode);
            }
        });
    });
    observer.observe(container, { childList: true, characterData: true, subtree: true });
}

function processSubtitleNode(node) {
    let newText = node.textContent;
    if (newText !== currentSubtitle) {
        currentSubtitle = newText;
        console.log('Detected new subtitle:', currentSubtitle);
        fetchAndPlayAudio(currentSubtitle);
    }
}
