// Global variables to manage state
let currentSubtitle = '';
let userHasInteracted = false;
let originalVolume = 1;  // Default volume

// Function to handle subtitle changes
function handleSubtitleChange(subtitleText) {
    const trimmedSubtitle = subtitleText.trim();
    if (trimmedSubtitle && trimmedSubtitle !== currentSubtitle) {
        currentSubtitle = trimmedSubtitle;
        console.log('New Subtitle:', currentSubtitle);
        chrome.runtime.sendMessage({
            type: "synthesizeSpeech",
            text: currentSubtitle
        }, function(response) {
            if (response && response.success) {
                console.log('Audio received for:', currentSubtitle);
                if (userHasInteracted) {
                    playAudio(response.audioBase64);
                }
            } else {
                console.debug('Failed to fetch audio:', response ? response.debug : 'No response');
            }
        });
    }
}

// Function to play audio from base64 string
function playAudio(base64) {
    muteVideo(true);
    if (!base64) {
        console.debug('Invalid or missing base64 audio data');
        return;
    }

    const audioBlob = base64toBlob(base64, 'audio/mpeg');
    if (!audioBlob) {
        console.debug('Failed to convert base64 to blob.');
        return;
    }

    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.play().then(() => {
        audio.addEventListener('ended', () => {
            muteVideo(true);
        });
    }).catch(error => {
        console.debug('Error playing audio:', error);
    });
}

// Convert base64 string to Blob
function base64toBlob(base64, contentType = '', sliceSize = 512) {
    try {
        const base64WithoutPrefix = base64.split(',')[1]; // Remove any prefix that is part of data URI
        const byteCharacters = atob(base64WithoutPrefix);
        const byteArrays = [];

        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            const slice = byteCharacters.slice(offset, offset + sliceSize);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }
        return new Blob(byteArrays, {type: contentType});
    } catch (error) {
        console.debug('Failed to decode base64 string:', error);
        return null; // Return null or handle as needed
    }
}

// Mute or unmute the video
function muteVideo(mute) {
    const video = document.querySelector('video');
    if (video) {
        if (mute) {
            originalVolume = video.volume;
            video.volume = 0;
        } else {
            video.volume = originalVolume;
        }
    }
}

// Observe subtitle changes and initial load
function observeSubtitles() {
    const targetNode = document.querySelector('.captions-display--captions-cue-text--TQ0DQ');

    if (targetNode) {
        const config = { childList: true, subtree: true, characterData: true };
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                let newText = '';
                if (mutation.type === 'childList' && mutation.addedNodes.length) {
                    newText = mutation.addedNodes[0].textContent;
                } else if (mutation.type === 'characterData') {
                    newText = mutation.target.data;
                }
                handleSubtitleChange(newText);
            });
        });
        observer.observe(targetNode, config);
        console.log('Subtitle observer initialized.');

        // Check initial subtitle content
        if (targetNode.textContent) {
            handleSubtitleChange(targetNode.textContent);
        }
    } else {
        console.log('Subtitle div not found. Retrying in 1 second...');
        setTimeout(observeSubtitles, 1000); // Retry finding the subtitle div
    }
}

// Listen for user interaction
document.addEventListener('click', () => {
    if (!userHasInteracted) {
        userHasInteracted = true;
        console.log('User interaction detected. Audio play enabled.');
        if (currentSubtitle) {
            playAudio(currentSubtitle);
        }
    }
});

// Start the subtitle monitoring process
observeSubtitles();
