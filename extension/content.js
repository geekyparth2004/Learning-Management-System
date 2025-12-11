// Listener for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "autofill") {
        const filledCount = autofillForm(request.data);
        sendResponse({ status: `Filled ${filledCount} fields! ✨` });
    }
});

function autofillForm(profile) {
    let count = 0;
    const inputs = document.querySelectorAll('input, textarea, select');

    inputs.forEach(input => {
        if (input.type === 'hidden' || input.style.display === 'none') return;
        if (input.value && input.value.length > 3) return; // Skip filled

        const name = (input.name || '').toLowerCase();
        const id = (input.id || '').toLowerCase();
        const label = findLabelText(input).toLowerCase();

        // --- PERSONAL ---
        if (isMatch(name, id, label, ['firstname', 'first_name', 'full_name', 'fullname', 'name']) && !isMatch(name, id, label, ['last', 'school', 'college', 'university', 'company'])) {
            setInput(input, profile.fullName); count++;
        }
        else if (isMatch(name, id, label, ['email', 'e-mail'])) {
            setInput(input, profile.email); count++;
        }
        else if (isMatch(name, id, label, ['phone', 'mobile', 'contact', 'tel'])) {
            setInput(input, profile.phone); count++;
        }
        else if (isMatch(name, id, label, ['address', 'residence', 'location'])) {
            setInput(input, profile.address); count++;
        }

        // --- UG (Highest Qualification) ---
        else if (isMatch(name, id, label, ['college', 'university', 'institute']) && !isMatch(name, id, label, ['10', '12', 'school'])) {
            setInput(input, profile.ugCollege); count++;
        }
        else if (isMatch(name, id, label, ['degree', 'qualification', 'course'])) {
            setInput(input, profile.ugDegree); count++; // e.g. B.Tech
        }
        else if (isMatch(name, id, label, ['branch', 'stream', 'specialization', 'major'])) {
            setInput(input, profile.ugBranch); count++; // e.g. CSE
        }
        else if (isMatch(name, id, label, ['cgpa', 'sgpa', 'gpa'])) {
            setInput(input, profile.ugScore); count++;
        }
        else if (isMatch(name, id, label, ['year', 'passing']) && !isMatch(name, id, label, ['10', '12'])) {
            setInput(input, profile.ugYear); count++;
        }

        // --- 12th ---
        else if (isMatch(name, id, label, ['12', 'hsc', 'intermediate']) && isMatch(name, id, label, ['school', 'college', 'board', 'percentage'])) {
            if (isMatch(name, id, label, ['school', 'college', 'institute'])) setInput(input, profile.twelfthSchool);
            else if (isMatch(name, id, label, ['board'])) setInput(input, profile.twelfthBoard);
            else if (isMatch(name, id, label, ['percen', 'score', 'marks'])) setInput(input, profile.twelfthScore);
            count++;
        }

        // --- 10th ---
        else if (isMatch(name, id, label, ['10', 'ssc', 'matric']) && isMatch(name, id, label, ['school', 'board', 'percentage'])) {
            if (isMatch(name, id, label, ['school', 'institute'])) setInput(input, profile.tenthSchool);
            else if (isMatch(name, id, label, ['board'])) setInput(input, profile.tenthBoard);
            else if (isMatch(name, id, label, ['percen', 'score', 'marks'])) setInput(input, profile.tenthScore);
            count++;
        }

        // --- LINKS ---
        else if (isMatch(name, id, label, ['linkedin'])) {
            setInput(input, profile.linkedin); count++;
        }
        else if (isMatch(name, id, label, ['github', 'git'])) {
            setInput(input, profile.github); count++;
        }
        else if (isMatch(name, id, label, ['portfolio', 'website', 'url', 'link']) && !isMatch(name, id, label, ['linkedin', 'github'])) {
            setInput(input, profile.portfolio); count++;
        }
    });

    return count;
}

function setInput(input, value) {
    if (!value) return;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
}

function isMatch(name, id, label, keywords) {
    return keywords.some(key => name.includes(key) || id.includes(key) || label.includes(key));
}

function findLabelText(input) {
    if (input.id) {
        const label = document.querySelector(`label[for="${input.id}"]`);
        if (label) return label.innerText;
    }
    const parentLabel = input.closest('label');
    if (parentLabel) return parentLabel.innerText;

    return input.getAttribute('aria-label') || input.getAttribute('placeholder') || '';
}
