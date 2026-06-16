/**
 * chord-editor.js
 * Interactive chord placement editor.
 * Click above a lyric line to place a chord, click an existing chord to edit/remove it.
 */

let chordsData = [...CHORDS_JSON]; // mutable copy
let activePopover = null;

// ─── Known chord list for autocomplete ───
const ALL_CHORDS = [
    'A','Am','A7','Am7','Asus2','Asus4','A#','A#m',
    'B','Bm','B7','Bb','Bbm',
    'C','Cm','C7','Cmaj7','Cadd9','C#','C#m',
    'D','Dm','D7','Dsus2','Dsus4','D#','D#m',
    'E','Em','E7','Esus4','Eb','Ebm',
    'F','Fm','F7','F#','F#m',
    'G','Gm','G7','G#','G#m',
];

// Helpers are inherited from chord-viewer.js

function updateChordCount() {
    const countEl = document.getElementById('chord-count');
    if (countEl) countEl.textContent = chordsData.length;
}

function closePopover() {
    if (activePopover) {
        activePopover.remove();
        activePopover = null;
    }
}

function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `${type === 'success' ? '✓' : '✗'} ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ─── Autocomplete dropdown ───
function createAutocomplete(input, onSelect) {
    const dropdown = document.createElement('div');
    dropdown.className = 'chord-autocomplete';
    dropdown.style.display = 'none';
    input.parentElement.appendChild(dropdown);

    let selectedIdx = -1;

    function updateList() {
        const val = input.value.trim().toLowerCase();
        dropdown.innerHTML = '';
        selectedIdx = -1;

        if (!val) {
            // Show common chords when empty
            const common = ['Em', 'Am', 'C', 'G', 'D', 'A', 'E', 'F', 'Dm', 'Bm'];
            common.forEach((chord, i) => {
                const item = document.createElement('div');
                item.className = 'chord-ac-item';
                item.textContent = chord;
                item.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    onSelect(chord);
                });
                dropdown.appendChild(item);
            });
            dropdown.style.display = 'block';
            return;
        }

        const matches = ALL_CHORDS.filter(c => c.toLowerCase().startsWith(val));
        // Also allow exact custom input
        if (matches.length === 0) {
            dropdown.style.display = 'none';
            return;
        }

        matches.slice(0, 10).forEach((chord, i) => {
            const item = document.createElement('div');
            item.className = 'chord-ac-item';
            // Highlight matching part
            const matchLen = val.length;
            item.innerHTML = `<strong>${chord.substring(0, matchLen)}</strong>${chord.substring(matchLen)}`;
            item.addEventListener('mousedown', (e) => {
                e.preventDefault();
                onSelect(chord);
            });
            dropdown.appendChild(item);
        });

        dropdown.style.display = 'block';
    }

    function navigate(dir) {
        const items = dropdown.querySelectorAll('.chord-ac-item');
        if (items.length === 0) return;

        if (selectedIdx >= 0 && selectedIdx < items.length) {
            items[selectedIdx].classList.remove('chord-ac-selected');
        }

        selectedIdx += dir;
        if (selectedIdx < 0) selectedIdx = items.length - 1;
        if (selectedIdx >= items.length) selectedIdx = 0;

        items[selectedIdx].classList.add('chord-ac-selected');
        items[selectedIdx].scrollIntoView({ block: 'nearest' });
    }

    function getSelected() {
        const items = dropdown.querySelectorAll('.chord-ac-item');
        if (selectedIdx >= 0 && selectedIdx < items.length) {
            return items[selectedIdx].textContent;
        }
        return null;
    }

    input.addEventListener('input', updateList);
    input.addEventListener('focus', updateList);
    input.addEventListener('blur', () => {
        setTimeout(() => { dropdown.style.display = 'none'; }, 150);
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); navigate(1); }
        if (e.key === 'ArrowUp') { e.preventDefault(); navigate(-1); }
        if (e.key === 'Tab' && dropdown.style.display !== 'none') {
            const sel = getSelected();
            if (sel) { e.preventDefault(); onSelect(sel); }
        }
    });

    return { getSelected, dropdown };
}

// ─── Render the editor ───
function renderEditor() {
    const lines = LYRICS_RAW.split('\n');
    const canvas = document.getElementById('editor-canvas');
    const charW = getCharWidth();
    canvas.innerHTML = '';

    // Group chords by line
    const chordsByLine = {};
    chordsData.forEach(c => {
        if (!chordsByLine[c.lineIndex]) chordsByLine[c.lineIndex] = [];
        chordsByLine[c.lineIndex].push(c);
    });

    lines.forEach((line, idx) => {
        if (isSectionLine(line)) {
            const label = document.createElement('div');
            label.className = 'editor-section-label';
            label.textContent = parseSectionName(line);
            canvas.appendChild(label);
            return;
        }

        if (line.trim() === '') return;

        const lineEl = document.createElement('div');
        lineEl.className = 'editor-line';

        // Clickable chord placement row
        const chordRow = document.createElement('div');
        chordRow.className = 'editor-chord-row';
        chordRow.style.width = Math.max(line.length * charW, 400) + 'px';

        // Existing chords on this line
        const lineChords = chordsByLine[idx] || [];
        lineChords.sort((a, b) => a.charIndex - b.charIndex);
        lineChords.forEach(c => {
            const chip = document.createElement('span');
            chip.className = 'editor-chord-item';
            chip.style.left = (c.charIndex * charW) + 'px';
            chip.textContent = c.chord;
            chip.title = `${c.chord} at position ${c.charIndex} — click to edit`;

            chip.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                closePopover();
                showEditPopover(chip, idx, c.charIndex, c.chord);
            });

            chordRow.appendChild(chip);
        });

        lineEl.appendChild(chordRow);

        // Lyric text
        const lyricRow = document.createElement('div');
        lyricRow.className = 'editor-lyric-row';
        lyricRow.textContent = line;
        lineEl.appendChild(lyricRow);

        // Click on anywhere in the line to add chord
        lineEl.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Ignore clicks on existing chords or popovers
            if (e.target.classList.contains('editor-chord-item') || e.target.closest('.chord-popover')) return;

            closePopover();

            const rect = chordRow.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const charIdx = Math.max(0, Math.round(clickX / charW));

            // Check if there's already a chord near this position
            const existing = lineChords.find(c => Math.abs(c.charIndex - charIdx) < 2);
            if (existing) return;

            showAddPopover(chordRow, idx, charIdx);
        });

        canvas.appendChild(lineEl);
    });

    updateChordCount();
}

// ─── Popover: Add chord ───
function showAddPopover(parentRow, lineIndex, charIndex) {
    const charW = getCharWidth();
    const pop = document.createElement('div');
    pop.className = 'chord-popover';
    pop.style.left = (charIndex * charW) + 'px';
    pop.style.top = '-42px';

    // Stop clicks inside the popover from bubbling
    pop.addEventListener('click', (e) => e.stopPropagation());
    pop.addEventListener('mousedown', (e) => e.stopPropagation());

    const inputWrap = document.createElement('div');
    inputWrap.style.position = 'relative';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Em';
    input.maxLength = 10;
    input.autocomplete = 'off';
    inputWrap.appendChild(input);

    const okBtn = document.createElement('button');
    okBtn.className = 'pop-btn';
    okBtn.textContent = '✓';

    function addChord(chordName) {
        const chord = (chordName || input.value).trim();
        if (chord) {
            chordsData.push({ lineIndex, charIndex, chord });
            closePopover();
            renderEditor();
        }
    }

    // Autocomplete
    const ac = createAutocomplete(input, (selected) => {
        addChord(selected);
    });

    okBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Use selected autocomplete item if available, otherwise use input value
        const sel = ac.getSelected();
        addChord(sel || input.value);
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const sel = ac.getSelected();
            addChord(sel || input.value);
        }
        if (e.key === 'Escape') {
            closePopover();
        }
    });

    pop.appendChild(inputWrap);
    pop.appendChild(okBtn);

    parentRow.appendChild(pop);
    activePopover = pop;

    // Focus after a small delay to ensure DOM is ready
    requestAnimationFrame(() => input.focus());
}

// ─── Popover: Edit / Remove chord ───
function showEditPopover(chipEl, lineIndex, charIndex, currentChord) {
    const charW = getCharWidth();
    const parentRow = chipEl.parentElement;

    const pop = document.createElement('div');
    pop.className = 'chord-popover';
    pop.style.left = (charIndex * charW) + 'px';
    pop.style.top = '-42px';

    // Stop clicks inside the popover from bubbling
    pop.addEventListener('click', (e) => e.stopPropagation());
    pop.addEventListener('mousedown', (e) => e.stopPropagation());

    const inputWrap = document.createElement('div');
    inputWrap.style.position = 'relative';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentChord;
    input.maxLength = 10;
    input.autocomplete = 'off';
    inputWrap.appendChild(input);

    const okBtn = document.createElement('button');
    okBtn.className = 'pop-btn';
    okBtn.textContent = '✓';

    const delBtn = document.createElement('button');
    delBtn.className = 'pop-btn pop-delete';
    delBtn.textContent = '✗';

    function updateChord(chordName) {
        const chord = (chordName || input.value).trim();
        if (chord) {
            const idx = chordsData.findIndex(c => c.lineIndex === lineIndex && c.charIndex === charIndex);
            if (idx >= 0) chordsData[idx].chord = chord;
            closePopover();
            renderEditor();
        }
    }

    function removeChord() {
        chordsData = chordsData.filter(c => !(c.lineIndex === lineIndex && c.charIndex === charIndex));
        closePopover();
        renderEditor();
    }

    // Autocomplete
    const ac = createAutocomplete(input, (selected) => {
        updateChord(selected);
    });

    okBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sel = ac.getSelected();
        updateChord(sel || input.value);
    });

    delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeChord();
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const sel = ac.getSelected();
            updateChord(sel || input.value);
        }
        if (e.key === 'Escape') closePopover();
        if (e.key === 'Delete' || (e.key === 'Backspace' && input.value === '')) {
            removeChord();
        }
    });

    pop.appendChild(inputWrap);
    pop.appendChild(okBtn);
    pop.appendChild(delBtn);

    parentRow.appendChild(pop);
    activePopover = pop;

    requestAnimationFrame(() => { input.focus(); input.select(); });
}

// ─── Save chords via AJAX ───
async function saveChords() {
    const btn = document.getElementById('save-btn');
    btn.textContent = 'Saving...';
    btn.disabled = true;

    try {
        const resp = await fetch(`/Songs/SaveChords/${SONG_ID}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chordsJson: JSON.stringify(chordsData) })
        });

        if (resp.ok) {
            showToast('Chords saved successfully!');
        } else {
            showToast('Failed to save chords', 'error');
        }
    } catch (err) {
        showToast('Network error — try again', 'error');
    } finally {
        btn.textContent = '💾 Save Chords';
        btn.disabled = false;
    }
}

// ─── Close popover on outside click ───
document.addEventListener('click', (e) => {
    if (activePopover && !activePopover.contains(e.target)) {
        closePopover();
    }
});

function initEditor() {
    renderEditor();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEditor);
} else {
    initEditor();
}
