document.addEventListener('DOMContentLoaded', () => {
    const fields = [
        'firstName', 'lastName', 'fullName',
        'fatherName', 'motherName', 'email', 'phone', 'address',
        'pan', 'aadhar', 'resume',
        'ugCollege', 'ugUniversity', 'ugDegree', 'ugBranch', 'ugSpecialization', 'ugScore', 'ugDuration',
        'twelfthSchool', 'twelfthLocation', 'twelfthScore',
        'tenthSchool', 'tenthLocation', 'tenthScore',
        'internCompany', 'internDuration', 'internDesc',
        'projectName', 'projectStack', 'projectDesc',
        'linkedin', 'github', 'portfolio'
    ];

    // Auto-generate Full Name
    const updateFullName = () => {
        const first = document.getElementById('firstName').value || '';
        const last = document.getElementById('lastName').value || '';
        document.getElementById('fullName').value = `${first} ${last}`.trim();
    };

    document.getElementById('firstName').addEventListener('input', updateFullName);
    document.getElementById('lastName').addEventListener('input', updateFullName);

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
