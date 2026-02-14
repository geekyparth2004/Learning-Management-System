const fs = require('fs');

const FILE_PATH = 'app/assignment/[id]/page.tsx';
let content = fs.readFileSync(FILE_PATH, 'utf8');

// Find the block around line 1080-1090
// Look for "Run tests to see results"
const startAnchor = 'Run tests to see results';
const endAnchor = 'activeTab === "ask-ai" && (';

const startIndex = content.indexOf(startAnchor);
const endIndex = content.indexOf(endAnchor);

if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find anchors');
    process.exit(1);
}

// Find lines around these anchors
// startAnchor is inside a div line 1083.
// We want to replace from line 1086 (closing divs) to line 1090 (empty line before next block).

const substring = content.substring(startIndex, endIndex);
console.log('Original substring:', substring);

// Construct the fix
// We need to close the Results block properly.
// The structure should be:
//                                                     Run tests to see results
//                                                 </div>
//                                             )}
//                                         </div>
//                                     </div>
//                                 )}

// Finding the last occurrence of )} before endAnchor in the original file would be tricky if it's broken.

// Let's replace the whole chunk from startAnchor line end to endAnchor line start.

const lines = content.split('\n');
let startLine = -1;
let endLine = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(startAnchor)) {
        startLine = i; // This is the line with "Run tests to see results"
    }
    if (lines[i].includes(endAnchor) && i > startLine) {
        endLine = i;
        break;
    }
}

if (startLine === -1 || endLine === -1) {
    console.error('Could not find lines');
    process.exit(1);
}

console.log(`Replacing lines ${startLine} to ${endLine}`);

// Lines from startLine (inclusive) to endLine (exclusive)
// startLine is 1083.
// We want to keep 1083, 1084 (</div>), 1085 ())).
// We want to fix 1086-1089.

// Let's replace from startLine + 1 (closing div of text) to endLine - 1 (empty line?).

const newContentLines = [
    '                                                </div>',
    '                                            )}',
    '                                        </div>',
    '                                    </div>',
    '                                )}'
];

// Reconstruct file
// Keep lines 0 to startLine
// Add "Run tests..." (lines[startLine] is the div content line)
// Add newContentLines
// Add lines from endLine to end

// Wait, startLine is inside the div.
// lines[startLine] = "                                                    Run tests to see results"
// lines[startLine+1] = "                                                </div>"

// Let's slice carefully.
// We want to replace everything between "Run tests to see results" line and "activeTab === "ask-ai"" line.

const prefix = lines.slice(0, startLine + 1).join('\n'); // Up to "Run tests..."
const suffix = lines.slice(endLine).join('\n'); // From "ask-ai" onwards

const cleanContent = prefix + '\n' + newContentLines.join('\n') + '\n\n' + suffix;

fs.writeFileSync(FILE_PATH, cleanContent);
console.log('File updated');
