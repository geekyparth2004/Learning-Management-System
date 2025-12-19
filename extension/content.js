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

        // --- PERSONAL & IDENTITY ---
        if (isMatch(name, id, label, ['first_name', 'firstname', 'fname']) && !isMatch(name, id, label, ['last', 'father', 'mother'])) {
            setInput(input, profile.firstName); count++;
        }
        else if (isMatch(name, id, label, ['last_name', 'lastname', 'lname']) && !isMatch(name, id, label, ['first', 'father', 'mother'])) {
            setInput(input, profile.lastName); count++;
        }
        else if (isMatch(name, id, label, ['full_name', 'fullname', 'name']) && !isMatch(name, id, label, ['first', 'last', 'father', 'mother', 'school', 'college', 'project', 'company'])) {
            setInput(input, profile.fullName); count++;
        }
        else if (isMatch(name, id, label, ['father', 'guardian'])) {
            setInput(input, profile.fatherName); count++;
        }
        else if (isMatch(name, id, label, ['mother'])) {
            setInput(input, profile.motherName); count++;
        }
        else if (isMatch(name, id, label, ['email', 'e-mail'])) {
            setInput(input, profile.email); count++;
        }
        else if (isMatch(name, id, label, ['phone', 'mobile', 'contact', 'tel'])) {
            setInput(input, profile.phone); count++;
        }
        else if (isMatch(name, id, label, ['permanent', 'address', 'residence']) && !isMatch(name, id, label, ['email', 'web'])) {
            setInput(input, profile.address); count++;
        }
        else if (isMatch(name, id, label, ['pan', 'tax'])) {
            setInput(input, profile.pan); count++;
        }
        else if (isMatch(name, id, label, ['aadhar', 'uid'])) {
            setInput(input, profile.aadhar); count++;
        }

        // --- UG (Highest Qualification) ---
        else if (isMatch(name, id, label, ['university'])) {
            setInput(input, profile.ugUniversity); count++;
        }
        else if (isMatch(name, id, label, ['college', 'institute']) && !isMatch(name, id, label, ['10', '12', 'school'])) {
            setInput(input, profile.ugCollege); count++;
        }
        else if (isMatch(name, id, label, ['degree', 'qualification', 'course'])) {
            setInput(input, profile.ugDegree); count++;
        }
        else if (isMatch(name, id, label, ['specialization'])) {
            setInput(input, profile.ugSpecialization); count++;
        }
        else if (isMatch(name, id, label, ['branch', 'stream', 'major'])) {
            setInput(input, profile.ugBranch); count++;
        }
        else if (isMatch(name, id, label, ['cgpa', 'sgpa', 'gpa']) || (isMatch(name, id, label, ['ug', 'degree']) && isMatch(name, id, label, ['score', 'mark', 'percen']))) {
            setInput(input, profile.ugScore); count++;
        }
        else if (isMatch(name, id, label, ['year', 'passing', 'duration']) && isMatch(name, id, label, ['ug', 'grad']) || (isMatch(name, id, label, ['passing']) && !isMatch(name, id, label, ['10', '12']))) {
            setInput(input, profile.ugDuration); count++;
        }

        // --- 12th ---
        else if (isMatch(name, id, label, ['12', 'hsc', 'intermediate', 'xii'])) {
            if (isMatch(name, id, label, ['school', 'college', 'institute'])) setInput(input, profile.twelfthSchool);
            else if (isMatch(name, id, label, ['board'])) setInput(input, 'CBSE'); // Default or input
            else if (isMatch(name, id, label, ['percen', 'score', 'marks'])) setInput(input, profile.twelfthScore);
            else if (isMatch(name, id, label, ['location', 'city'])) setInput(input, profile.twelfthLocation);
            count++;
        }

        // --- 10th ---
        else if (isMatch(name, id, label, ['10', 'ssc', 'matric', 'x'])) {
            if (isMatch(name, id, label, ['school', 'institute'])) setInput(input, profile.tenthSchool);
            else if (isMatch(name, id, label, ['board'])) setInput(input, 'CBSE'); // Default or input
            else if (isMatch(name, id, label, ['percen', 'score', 'marks'])) setInput(input, profile.tenthScore);
            else if (isMatch(name, id, label, ['location', 'city'])) setInput(input, profile.tenthLocation);
            count++;
        }

        // --- INTERNSHIP ---
        else if (isMatch(name, id, label, ['intern', 'experience', 'work']) && !isMatch(name, id, label, ['net', 'social'])) {
            if (isMatch(name, id, label, ['company', 'employer', 'organization'])) setInput(input, profile.internCompany);
            else if (isMatch(name, id, label, ['durat', 'period', 'from'])) setInput(input, profile.internDuration);
            else if (isMatch(name, id, label, ['desc', 'role', 'responsib'])) setInput(input, profile.internDesc);
            count++;
        }

        // --- PROJECTS ---
        else if (isMatch(name, id, label, ['project'])) {
            if (isMatch(name, id, label, ['name', 'title'])) setInput(input, profile.projectName);
            else if (isMatch(name, id, label, ['tech', 'stack', 'tool'])) setInput(input, profile.projectStack);
            else if (isMatch(name, id, label, ['desc', 'abou', 'detail'])) setInput(input, profile.projectDesc);
            count++;
        }

        // --- LINKS & RESUME ---
        else if (isMatch(name, id, label, ['resume', 'cv', 'bio']) && (input.type === 'text' || input.type === 'url')) {
            setInput(input, profile.resume); count++;
        }
        else if (isMatch(name, id, label, ['linkedin'])) {
            setInput(input, profile.linkedin); count++;
        }
        else if (isMatch(name, id, label, ['github', 'git'])) {
            setInput(input, profile.github); count++;
        }
        else if (isMatch(name, id, label, ['portfolio', 'website', 'url', 'link']) && !isMatch(name, id, label, ['linkedin', 'github', 'resume'])) {
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
