document.addEventListener('DOMContentLoaded', () => {
    const fields = [
        'fullName', 'email', 'phone', 'address',
        'ugCollege', 'ugDegree', 'ugBranch', 'ugScore', 'ugYear',
        'twelfthSchool', 'twelfthBoard', 'twelfthScore',
        'tenthSchool', 'tenthBoard', 'tenthScore',
        'linkedin', 'github', 'portfolio'
    ];

    // Load saved data
    chrome.storage.sync.get(['profile'], (result) => {
        if (result.profile) {
            fields.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = result.profile[id] || '';
            });
        }
    });

    // Save data
    document.getElementById('saveBtn').addEventListener('click', () => {
        const profile = {};
        fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) profile[id] = el.value;
        });

        chrome.storage.sync.set({ profile }, () => {
            const status = document.getElementById('status');
            status.textContent = 'Full Profile saved! ✅';
            status.style.color = '#4ade80';
            setTimeout(() => status.textContent = '', 2000);
        });
    });

    // Trigger Autofill
    document.getElementById('autofillBtn').addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // Get profile data first
        chrome.storage.sync.get(['profile'], (result) => {
            if (!result.profile) {
                document.getElementById('status').textContent = 'Please save profile first!';
                document.getElementById('status').style.color = '#ef4444';
                return;
            }

            // Send message to content script
            chrome.tabs.sendMessage(tab.id, {
                action: "autofill",
                data: result.profile
            }, (response) => {
                if (chrome.runtime.lastError) {
                    document.getElementById('status').textContent = 'Reload page & try again.';
                } else {
                    document.getElementById('status').textContent = response?.status || 'Autofill started...';
                }
            });
        });
    });
});
