/**
 * chord-editor.js
 * Interactive chord placement editor.
 * Supports multiple stacked chord rows above each lyric line via rowIndex.
 * Right-click for context menu; drag chips to reposition.
 */

// ── Data initialisation ──
// Normalise legacy data: add rowIndex = 0 if missing
let chordsData = CHORDS_JSON.map(c => ({ ...c, rowIndex: c.rowIndex ?? 0 }));
let activePopover = null;
let copiedRow = null; // { chords: [{charIndex, chord}] } — row clipboard

// ── Known chord list for autocomplete ──
const ALL_CHORDS = [
    'A','Am','A7','Am7','Asus2','Asus4','A#','A#m',
    'B','Bm','B7','Bb','Bbm',
    'C','Cm','C7','Cmaj7','Cadd9','C#','C#m',
    'D','Dm','D7','Dsus2','Dsus4','D#','D#m',
    'E','Em','E7','Esus4','Eb','Ebm',
    'F','Fm','F7','Fmaj7','F#','F#m',
    'G','Gm','G7','G#','G#m',
];

// ── Helpers (shared with chord-viewer.js via globals) ──

function updateChordCount() {
    const el = document.getElementById('chord-count');
    if (el) el.textContent = chordsData.length;
}

function closePopover() {
    if (activePopover) { activePopover.remove(); activePopover = null; }
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

// ── rowIndex helpers ──

/** Safely get rowIndex from a chord entry (0 for legacy data) */
function ri(c) { return c.rowIndex ?? 0; }

/**
 * Get the sorted list of rowIndexes to display for a lyric line.
 * Always includes 0 (every line always has at least one chord row).
 * Also includes rows with existing chords and explicitly-inserted empty rows.
 */
function getDisplayRowIndexes(lineIndex) {
    const fromChords = chordsData.filter(c => c.lineIndex === lineIndex).map(ri);
    const fromExtra = _extraRows[lineIndex] ? [..._extraRows[lineIndex]] : [];
    const all = new Set([0, ...fromChords, ...fromExtra]);
    return [...all].sort((a, b) => a - b);
}

function getMaxDisplayRowIndex(lineIndex) {
    const rows = getDisplayRowIndexes(lineIndex);
    return rows[rows.length - 1];
}

// ── Extra (empty) row tracking ──
// Rows inserted via context menu that have no chords yet.
// These vanish on page reload (intentional — empty rows don't need saving).
const _extraRows = {}; // { [lineIndex]: Set<rowIndex> }

function _trackExtraRow(lineIndex, rowIndex) {
    if (!_extraRows[lineIndex]) _extraRows[lineIndex] = new Set();
    _extraRows[lineIndex].add(rowIndex);
}

function _untrackExtraRow(lineIndex, rowIndex) {
    if (_extraRows[lineIndex]) {
        _extraRows[lineIndex].delete(rowIndex);
        if (_extraRows[lineIndex].size === 0) delete _extraRows[lineIndex];
    }
}

function _shiftExtraRows(lineIndex, fromRowIndex, delta) {
    if (!_extraRows[lineIndex]) return;
    const shifted = new Set();
    _extraRows[lineIndex].forEach(r => shifted.add(r >= fromRowIndex ? r + delta : r));
    _extraRows[lineIndex] = shifted;
}

// ── Chord row CRUD operations ──

/**
 * Insert a new empty chord row above or below the given rowIndex.
 * Shifts existing chord rows (and extra-row tracking) to make room.
 */
function insertChordRow(lineIndex, rowIndex, position) {
    const insertAt = position === 'above' ? rowIndex : rowIndex + 1;

    chordsData = chordsData.map(c =>
        (c.lineIndex === lineIndex && ri(c) >= insertAt)
            ? { ...c, rowIndex: ri(c) + 1 }
            : c
    );
    _shiftExtraRows(lineIndex, insertAt, 1);
    _trackExtraRow(lineIndex, insertAt);

    renderEditor();
    showToast(`New chord row inserted ${position}`);
}

/**
 * Delete the chord row at rowIndex for lineIndex.
 * If it's the only row, just clears its chords (row 0 always stays).
 */
function deleteChordRow(lineIndex, rowIndex) {
    const displayRows = getDisplayRowIndexes(lineIndex);

    // Remove chords on this row
    chordsData = chordsData.filter(c => !(c.lineIndex === lineIndex && ri(c) === rowIndex));

    if (displayRows.length <= 1) {
        // Only row — clear but keep the visual row visible
        showToast('Chord row cleared');
        renderEditor();
        return;
    }

    // Shift rows above the deleted one downward
    chordsData = chordsData.map(c =>
        (c.lineIndex === lineIndex && ri(c) > rowIndex)
            ? { ...c, rowIndex: ri(c) - 1 }
            : c
    );

    // Update extra-row tracking
    if (_extraRows[lineIndex]) {
        const updated = new Set();
        _extraRows[lineIndex].forEach(r => {
            if (r === rowIndex) return;           // remove the deleted row
            updated.add(r > rowIndex ? r - 1 : r); // shift higher rows down
        });
        _extraRows[lineIndex] = updated;
        if (_extraRows[lineIndex].size === 0) delete _extraRows[lineIndex];
    }

    showToast('Chord row deleted');
    renderEditor();
}

/** Copy all chords of a specific chord row to the clipboard */
function copyChordRow(lineIndex, rowIndex) {
    const chords = chordsData
        .filter(c => c.lineIndex === lineIndex && ri(c) === rowIndex)
        .map(c => ({ charIndex: c.charIndex, chord: c.chord }));
    copiedRow = { chords };
    showToast(`Row copied (${chords.length} chord${chords.length !== 1 ? 's' : ''})`);
}

/** Add a new empty chord row at the bottom of a lyric line (from lyric row context menu) */
function addChordRowToLine(lineIndex) {
    const newRowIdx = getMaxDisplayRowIndex(lineIndex) + 1;
    _trackExtraRow(lineIndex, newRowIdx);
    renderEditor();
    showToast('New chord row added');
}

/** Paste copied row onto an existing chord row (replaces its chords) */
function pasteChordRowReplace(lineIndex, rowIndex) {
    if (!copiedRow) return;
    chordsData = chordsData.filter(c => !(c.lineIndex === lineIndex && ri(c) === rowIndex));
    copiedRow.chords.forEach(c => {
        chordsData.push({ lineIndex, rowIndex, charIndex: c.charIndex, chord: c.chord });
    });
    renderEditor();
    showToast('Chords pasted onto row');
}

/** Paste copied row as a new chord row inserted below the given rowIndex */
function pasteChordRowInsertBelow(lineIndex, rowIndex) {
    if (!copiedRow) return;
    const newRowIdx = rowIndex + 1;

    chordsData = chordsData.map(c =>
        (c.lineIndex === lineIndex && ri(c) >= newRowIdx)
            ? { ...c, rowIndex: ri(c) + 1 }
            : c
    );
    _shiftExtraRows(lineIndex, newRowIdx, 1);

    copiedRow.chords.forEach(c => {
        chordsData.push({ lineIndex, rowIndex: newRowIdx, charIndex: c.charIndex, chord: c.chord });
    });

    renderEditor();
    showToast('Chords pasted as new row below');
}

// ── Autocomplete dropdown ──
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
            const common = ['Em', 'Am', 'C', 'G', 'D', 'A', 'E', 'F', 'Dm', 'Bm'];
            common.forEach(chord => {
                const item = document.createElement('div');
                item.className = 'chord-ac-item';
                item.textContent = chord;
                item.addEventListener('mousedown', e => { e.preventDefault(); onSelect(chord); });
                dropdown.appendChild(item);
            });
            dropdown.style.display = 'block';
            return;
        }

        const matches = ALL_CHORDS.filter(c => c.toLowerCase().startsWith(val));
        if (!matches.length) { dropdown.style.display = 'none'; return; }

        matches.slice(0, 10).forEach(chord => {
            const item = document.createElement('div');
            item.className = 'chord-ac-item';
            const len = val.length;
            item.innerHTML = `<strong>${chord.substring(0, len)}</strong>${chord.substring(len)}`;
            item.addEventListener('mousedown', e => { e.preventDefault(); onSelect(chord); });
            dropdown.appendChild(item);
        });
        dropdown.style.display = 'block';
    }

    function navigate(dir) {
        const items = dropdown.querySelectorAll('.chord-ac-item');
        if (!items.length) return;
        if (selectedIdx >= 0 && selectedIdx < items.length)
            items[selectedIdx].classList.remove('chord-ac-selected');
        selectedIdx = (selectedIdx + dir + items.length) % items.length;
        items[selectedIdx].classList.add('chord-ac-selected');
        items[selectedIdx].scrollIntoView({ block: 'nearest' });
    }

    function getSelected() {
        const items = dropdown.querySelectorAll('.chord-ac-item');
        return (selectedIdx >= 0 && selectedIdx < items.length)
            ? items[selectedIdx].textContent : null;
    }

    input.addEventListener('input', updateList);
    input.addEventListener('focus', updateList);
    input.addEventListener('blur', () => setTimeout(() => { dropdown.style.display = 'none'; }, 150));
    input.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown') { e.preventDefault(); navigate(1); }
        if (e.key === 'ArrowUp')   { e.preventDefault(); navigate(-1); }
        if (e.key === 'Tab' && dropdown.style.display !== 'none') {
            const sel = getSelected();
            if (sel) { e.preventDefault(); onSelect(sel); }
        }
    });

    return { getSelected, dropdown };
}

// ── Context Menu ──
let activeContextMenu = null;

function closeContextMenu() {
    if (activeContextMenu) { activeContextMenu.remove(); activeContextMenu = null; }
}

function showContextMenu(e, items) {
    e.preventDefault();
    e.stopPropagation();
    closeContextMenu();
    closePopover();

    const menu = document.createElement('div');
    menu.className = 'editor-context-menu';
    menu.style.cssText = 'position:fixed;z-index:9999;left:-9999px;top:-9999px;';

    items.forEach(item => {
        if (item.separator) {
            const sep = document.createElement('div');
            sep.className = 'ctx-separator';
            menu.appendChild(sep);
            return;
        }
        const btn = document.createElement('button');
        btn.className = 'ctx-item' + (item.disabled ? ' ctx-disabled' : '');
        btn.innerHTML = `<span class="ctx-icon">${item.icon}</span><span>${item.label}</span>`;
        if (!item.disabled) {
            btn.addEventListener('mousedown', ev => {
                ev.preventDefault();
                closeContextMenu();
                item.action();
            });
        }
        menu.appendChild(btn);
    });

    document.body.appendChild(menu);
    activeContextMenu = menu;

    requestAnimationFrame(() => {
        const vw = window.innerWidth, vh = window.innerHeight;
        let x = e.clientX, y = e.clientY;
        const mw = menu.offsetWidth, mh = menu.offsetHeight;
        if (x + mw > vw) x = vw - mw - 8;
        if (y + mh > vh) y = vh - mh - 8;
        menu.style.left = x + 'px';
        menu.style.top  = y + 'px';
    });
}

/** Build context menu for right-clicking a chord row */
function buildChordRowContextMenu(e, lineIndex, rowIndex) {
    const hasCopied = copiedRow !== null;
    const items = [
        { label: 'Copy chord row',       icon: '⧉', action: () => copyChordRow(lineIndex, rowIndex) },
        { label: 'Insert row above',      icon: '⬆', action: () => insertChordRow(lineIndex, rowIndex, 'above') },
        { label: 'Insert row below',      icon: '⬇', action: () => insertChordRow(lineIndex, rowIndex, 'below') },
        { label: 'Delete chord row',      icon: '🗑', action: () => deleteChordRow(lineIndex, rowIndex) },
    ];
    if (hasCopied) {
        items.push({ separator: true });
        items.push({ label: 'Paste onto this row',      icon: '📋', action: () => pasteChordRowReplace(lineIndex, rowIndex) });
        items.push({ label: 'Paste as new row below',   icon: '📥', action: () => pasteChordRowInsertBelow(lineIndex, rowIndex) });
    }
    showContextMenu(e, items);
}

/** Build context menu for right-clicking a lyric row */
function buildLyricRowContextMenu(e, lineIndex) {
    const hasCopied = copiedRow !== null;
    const items = [
        { label: 'Add chord row', icon: '➕', action: () => addChordRowToLine(lineIndex) },
    ];
    if (hasCopied) {
        items.push({ separator: true });
        items.push({
            label: 'Paste as new chord row',
            icon: '📥',
            action: () => {
                const newRowIdx = getMaxDisplayRowIndex(lineIndex) + 1;
                _trackExtraRow(lineIndex, newRowIdx);
                pasteChordRowReplace(lineIndex, newRowIdx);
            }
        });
    }
    showContextMenu(e, items);
}

// ── Render the editor ──
function renderEditor() {
    const lines = LYRICS_RAW.split('\n');
    const canvas = document.getElementById('editor-canvas');
    const charW = getCharWidth();
    canvas.innerHTML = '';

    lines.forEach((line, idx) => {
        let isSection = isSectionLine(line);
        if (line.trim() === '' && !isSection) return;

        const lineEl = document.createElement('div');
        lineEl.className = 'editor-line';
        lineEl.dataset.rawLineIndex = idx;

        // If it's a section, render the label first.
        if (isSection) {
            const label = document.createElement('div');
            label.className = 'editor-section-label';
            label.textContent = parseSectionName(line);
            // Allow adding chord rows to section headers
            label.addEventListener('contextmenu', e => buildLyricRowContextMenu(e, idx));
            lineEl.appendChild(label);
        }

        // ── Render one editor-chord-row per rowIndex ──
        const displayRowIndexes = getDisplayRowIndexes(idx);

        displayRowIndexes.forEach(rowIdx => {
            const lineChords = chordsData.filter(c => c.lineIndex === idx && ri(c) === rowIdx);
            lineChords.sort((a, b) => a.charIndex - b.charIndex);

            const chordRow = document.createElement('div');
            chordRow.className = 'editor-chord-row';
            chordRow.style.width = Math.max(line.length * charW, 400) + 'px';
            chordRow.dataset.lineIndex = idx;
            chordRow.dataset.rowIndex  = rowIdx;

            // Chord chips
            lineChords.forEach(c => {
                const chip = createChordChip(chordRow, idx, rowIdx, c, charW);
                chordRow.appendChild(chip);
            });

            // Click empty space → add chord to this specific row
            chordRow.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
                if (e.target.classList.contains('editor-chord-item') || e.target.closest('.chord-popover')) return;
                closePopover();

                const rect = chordRow.getBoundingClientRect();
                const charIdx = Math.max(0, Math.round((e.clientX - rect.left) / charW));
                if (lineChords.find(c => Math.abs(c.charIndex - charIdx) < 2)) return;

                showAddPopover(chordRow, idx, rowIdx, charIdx);
            });

            // Right-click → chord row context menu
            chordRow.addEventListener('contextmenu', e => buildChordRowContextMenu(e, idx, rowIdx));

            lineEl.appendChild(chordRow);
        });

        // If NOT a section, render the lyric row AFTER the chord rows
        if (!isSection) {
            const lyricRow = document.createElement('div');
            lyricRow.className = 'editor-lyric-row';
            lyricRow.textContent = line;
            lyricRow.addEventListener('contextmenu', e => buildLyricRowContextMenu(e, idx));
            lineEl.appendChild(lyricRow);
        }

        canvas.appendChild(lineEl);
    });

    updateChordCount();
}

// ── Chord chip with pointer-drag support ──
function createChordChip(parentRow, lineIndex, rowIndex, chordEntry, charW) {
    const chip = document.createElement('span');
    chip.className = 'editor-chord-item';
    chip.style.left = (chordEntry.charIndex * charW) + 'px';
    chip.textContent = chordEntry.chord;
    chip.title = `${chordEntry.chord} — click to edit, drag to move`;

    let isDragging   = false;
    let dragStartX   = 0;
    let dragOrigIdx  = chordEntry.charIndex;
    let suppressClick = false;

    chip.addEventListener('pointerdown', e => {
        if (e.button !== 0) return;
        e.stopPropagation();
        isDragging    = false;
        suppressClick = false;
        dragStartX    = e.clientX;
        dragOrigIdx   = chordEntry.charIndex;
        chip.setPointerCapture(e.pointerId);
        chip.addEventListener('pointermove', onMove);
        chip.addEventListener('pointerup',   onUp);
        chip.addEventListener('pointercancel', onUp);
    });

    function onMove(e) {
        const dx = e.clientX - dragStartX;
        if (!isDragging && Math.abs(dx) > 4) {
            isDragging = true;
            chip.classList.add('dragging');
        }
        if (isDragging) {
            chip.style.left = Math.max(0, dragOrigIdx * charW + dx) + 'px';
        }
    }

    function onUp(e) {
        chip.removeEventListener('pointermove', onMove);
        chip.removeEventListener('pointerup',   onUp);
        chip.removeEventListener('pointercancel', onUp);

        if (isDragging) {
            suppressClick = true;
            isDragging    = false;
            chip.classList.remove('dragging');

            const dx = e.clientX - dragStartX;
            const newCharIdx = Math.max(0, Math.round((dragOrigIdx * charW + dx) / charW));

            // Find and update the specific chord in chordsData (match by lineIndex + rowIndex + old charIndex)
            const entry = chordsData.find(c =>
                c.lineIndex === lineIndex && ri(c) === rowIndex && c.charIndex === chordEntry.charIndex
            );
            if (entry) {
                entry.charIndex = newCharIdx;
                chordEntry.charIndex = newCharIdx;
            }
            renderEditor();
        }
    }

    chip.addEventListener('click', e => {
        if (suppressClick) { suppressClick = false; e.preventDefault(); e.stopPropagation(); return; }
        e.preventDefault();
        e.stopPropagation();
        closePopover();
        showEditPopover(chip, lineIndex, rowIndex, chordEntry.charIndex, chordEntry.chord);
    });

    return chip;
}

// ── Popover: Add chord ──
function showAddPopover(parentRow, lineIndex, rowIndex, charIndex) {
    const charW = getCharWidth();
    const pop = document.createElement('div');
    pop.className = 'chord-popover';
    pop.style.left = (charIndex * charW) + 'px';
    pop.style.top  = '-42px';
    pop.addEventListener('click',     e => e.stopPropagation());
    pop.addEventListener('mousedown', e => e.stopPropagation());

    const wrap = document.createElement('div');
    wrap.style.position = 'relative';
    const input = document.createElement('input');
    input.type = 'text'; input.placeholder = 'Em'; input.maxLength = 10; input.autocomplete = 'off';
    wrap.appendChild(input);

    const ok = document.createElement('button');
    ok.className = 'pop-btn'; ok.textContent = '✓';

    function addChord(name) {
        const chord = (name || input.value).trim();
        if (!chord) return;
        // Once a chord is added to an extra (empty) row, it becomes a real chord row
        _untrackExtraRow(lineIndex, rowIndex);
        chordsData.push({ lineIndex, rowIndex, charIndex, chord });
        closePopover();
        renderEditor();
    }

    const ac = createAutocomplete(input, addChord);
    ok.addEventListener('click', e => { e.stopPropagation(); addChord(ac.getSelected() || input.value); });
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter')  { e.preventDefault(); addChord(ac.getSelected() || input.value); }
        if (e.key === 'Escape') closePopover();
    });

    pop.appendChild(wrap);
    pop.appendChild(ok);
    parentRow.appendChild(pop);
    activePopover = pop;
    requestAnimationFrame(() => input.focus());
}

// ── Popover: Edit / Remove chord ──
function showEditPopover(chipEl, lineIndex, rowIndex, charIndex, currentChord) {
    const charW = getCharWidth();
    const pop = document.createElement('div');
    pop.className = 'chord-popover';
    pop.style.left = (charIndex * charW) + 'px';
    pop.style.top  = '-42px';
    pop.addEventListener('click',     e => e.stopPropagation());
    pop.addEventListener('mousedown', e => e.stopPropagation());

    const wrap = document.createElement('div');
    wrap.style.position = 'relative';
    const input = document.createElement('input');
    input.type = 'text'; input.value = currentChord; input.maxLength = 10; input.autocomplete = 'off';
    wrap.appendChild(input);

    const ok  = document.createElement('button'); ok.className = 'pop-btn'; ok.textContent = '✓';
    const del = document.createElement('button'); del.className = 'pop-btn pop-delete'; del.textContent = '✗';

    function updateChord(name) {
        const chord = (name || input.value).trim();
        if (!chord) return;
        const idx = chordsData.findIndex(c =>
            c.lineIndex === lineIndex && ri(c) === rowIndex && c.charIndex === charIndex
        );
        if (idx >= 0) chordsData[idx].chord = chord;
        closePopover(); renderEditor();
    }

    function removeChord() {
        chordsData = chordsData.filter(c =>
            !(c.lineIndex === lineIndex && ri(c) === rowIndex && c.charIndex === charIndex)
        );
        closePopover(); renderEditor();
    }

    const ac = createAutocomplete(input, updateChord);
    ok.addEventListener('click',  e => { e.stopPropagation(); updateChord(ac.getSelected() || input.value); });
    del.addEventListener('click', e => { e.stopPropagation(); removeChord(); });
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter')  { e.preventDefault(); updateChord(ac.getSelected() || input.value); }
        if (e.key === 'Escape') closePopover();
        if (e.key === 'Delete' || (e.key === 'Backspace' && input.value === '')) removeChord();
    });

    pop.appendChild(wrap); pop.appendChild(ok); pop.appendChild(del);
    chipEl.parentElement.appendChild(pop);
    activePopover = pop;
    requestAnimationFrame(() => { input.focus(); input.select(); });
}

// ── Save chords via AJAX ──
async function saveChords() {
    const btn = document.getElementById('save-btn');
    if (btn) { btn.textContent = 'Saving...'; btn.disabled = true; }

    try {
        const resp = await fetch(`/Songs/SaveChords/${SONG_ID}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chordsJson: JSON.stringify(chordsData) })
        });
        showToast(resp.ok ? 'Chords saved successfully!' : 'Failed to save chords', resp.ok ? 'success' : 'error');
    } catch {
        showToast('Network error — try again', 'error');
    } finally {
        if (btn) { btn.textContent = '💾 Save Chords'; btn.disabled = false; }
    }
}

// ── Global close handlers ──
document.addEventListener('click', e => {
    if (activePopover     && !activePopover.contains(e.target))     closePopover();
    if (activeContextMenu && !activeContextMenu.contains(e.target)) closeContextMenu();
});
document.addEventListener('contextmenu', e => {
    if (activeContextMenu && !activeContextMenu.contains(e.target)) closeContextMenu();
});
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeContextMenu(); closePopover(); }
});
window.addEventListener('scroll', closeContextMenu, { passive: true });

// ── Init ──
function initEditor() { renderEditor(); }

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEditor);
} else {
    initEditor();
}
