document.addEventListener('DOMContentLoaded', () => {
    const toggleSwitch = document.getElementById('toggleSwitch');

    // Load the current state from storage and set the checkbox state accordingly
    chrome.storage.sync.get('synthesisEnabled', data => {
        toggleSwitch.checked = !!data.synthesisEnabled;  // Make sure it's a boolean
        console.log('Popup loaded, toggle state:', toggleSwitch.checked);
    });

    // Add event listener for toggle switch changes
    toggleSwitch.addEventListener('change', () => {
        const isEnabled = toggleSwitch.checked;
        console.log('Toggle changed, new state:', isEnabled);

        // Save the new state in storage
        chrome.storage.sync.set({ synthesisEnabled: isEnabled });

        // Send a message to all content scripts to update their state
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs.length > 0) {
                chrome.tabs.sendMessage(tabs[0].id, {type: 'toggleSynthesis', enabled: isEnabled});
            }
        });
    });
});
