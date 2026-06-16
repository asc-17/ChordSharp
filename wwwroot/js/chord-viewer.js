/**
 * chord-viewer.js
 * Renders the formatted chord sheet: sections, chords above lyrics, VexChords diagrams,
 * strumming pattern, and footer legend.
 */

// ─── Built-in chord fingering dictionary ───
const CHORD_DB = {
    'C':    { chord: [[1,0],[2,1],[3,0],[4,2],[5,3],[6,'x']] },
    'Cm':   { chord: [[1,3],[2,4],[3,5],[4,5],[5,3],[6,'x']], barres:[{fromString:6,toString:1,fret:3}] },
    'C7':   { chord: [[1,0],[2,1],[3,3],[4,2],[5,3],[6,'x']] },
    'Cmaj7':{ chord: [[1,0],[2,0],[3,0],[4,2],[5,3],[6,'x']] },
    'D':    { chord: [[1,2],[2,3],[3,2],[4,0],[5,'x'],[6,'x']] },
    'Dm':   { chord: [[1,1],[2,3],[3,2],[4,0],[5,'x'],[6,'x']] },
    'D7':   { chord: [[1,2],[2,1],[3,2],[4,0],[5,'x'],[6,'x']] },
    'E':    { chord: [[1,0],[2,0],[3,1],[4,2],[5,2],[6,0]] },
    'Em':   { chord: [[1,0],[2,0],[3,0],[4,2],[5,2],[6,0]] },
    'E7':   { chord: [[1,0],[2,0],[3,1],[4,0],[5,2],[6,0]] },
    'F':    { chord: [[3,2],[4,3],[5,3]], barres:[{fromString:6,toString:1,fret:1}] },
    'Fm':   { chord: [[3,1],[4,3],[5,3]], barres:[{fromString:6,toString:1,fret:1}] },
    'G':    { chord: [[1,3],[2,0],[3,0],[4,0],[5,2],[6,3]] },
    'Gm':   { chord: [[1,3],[2,3],[4,5],[5,5]], barres:[{fromString:6,toString:1,fret:3}] },
    'G7':   { chord: [[1,1],[2,0],[3,0],[4,0],[5,2],[6,3]] },
    'A':    { chord: [[1,0],[2,2],[3,2],[4,2],[5,0],[6,'x']] },
    'Am':   { chord: [[1,0],[2,1],[3,2],[4,2],[5,0],[6,'x']] },
    'A7':   { chord: [[1,0],[2,2],[3,0],[4,2],[5,0],[6,'x']] },
    'Am7':  { chord: [[1,0],[2,1],[3,0],[4,2],[5,0],[6,'x']] },
    'B':    { chord: [[3,4],[4,4]], barres:[{fromString:5,toString:1,fret:2}] },
    'Bm':   { chord: [[1,2],[2,3],[3,4],[4,4],[5,2],[6,'x']], barres:[{fromString:5,toString:1,fret:2}] },
    'B7':   { chord: [[1,2],[2,0],[3,2],[4,1],[5,2],[6,'x']] },
    'Cadd9':{ chord: [[1,0],[2,3],[3,0],[4,2],[5,3],[6,'x']] },
    'Dsus2':{ chord: [[1,0],[2,3],[3,2],[4,0],[5,'x'],[6,'x']] },
    'Dsus4':{ chord: [[1,3],[2,3],[3,2],[4,0],[5,'x'],[6,'x']] },
    'Asus2':{ chord: [[1,0],[2,0],[3,2],[4,2],[5,0],[6,'x']] },
    'Asus4':{ chord: [[1,0],[2,3],[3,2],[4,2],[5,0],[6,'x']] },
    'Esus4':{ chord: [[1,0],[2,0],[3,2],[4,2],[5,2],[6,0]] },
    'F#m':  { chord: [[1,2],[2,2],[3,2],[4,4],[5,4],[6,2]], barres:[{fromString:6,toString:1,fret:2}] },
    'Bb':   { chord: [[3,3],[4,3]], barres:[{fromString:5,toString:1,fret:1}] },
    'Eb':   { chord: [[1,3],[2,4],[4,5],[5,6]], barres:[{fromString:6,toString:1,fret:3}] },
};

const CHORD_NAMES_FULL = {
    'C':'C major','Cm':'C minor','C7':'C7','Cmaj7':'Cmaj7',
    'D':'D major','Dm':'D minor','D7':'D7',
    'E':'E major','Em':'E minor','E7':'E7',
    'F':'F major (barre)','Fm':'F minor',
    'G':'G major','Gm':'G minor','G7':'G7',
    'A':'A major','Am':'A minor','A7':'A7','Am7':'Am7',
    'B':'B major (barre)','Bm':'B minor (barre)','B7':'B7',
    'Cadd9':'Cadd9','Dsus2':'Dsus2','Dsus4':'Dsus4',
    'Asus2':'Asus2','Asus4':'Asus4','Esus4':'Esus4',
    'F#m':'F# minor (barre)','Bb':'Bb major','Eb':'Eb major',
};

// ─── Helpers ───
function isSectionLine(line) {
    return /^\[.+\]$/.test(line.trim());
}

function parseSectionName(line) {
    const m = line.trim().match(/^\[(.+)\]$/);
    return m ? m[1] : '';
}

// Measure character width in monospace
let _charWidth = null;
function getCharWidth() {
    if (_charWidth) return _charWidth;
    const span = document.createElement('span');
    span.style.fontFamily = "'Courier Prime', monospace";
    span.style.fontSize = '15px';
    span.style.position = 'absolute';
    span.style.visibility = 'hidden';
    span.style.whiteSpace = 'pre';
    span.textContent = 'MMMMMMMMMM';
    document.body.appendChild(span);
    _charWidth = span.offsetWidth / 10;
    document.body.removeChild(span);
    return _charWidth;
}

// ─── Main render ───
function initViewer() {
    if (!document.getElementById('lyrics-container')) return;
    const lines = LYRICS_RAW.split('\n');
    const chords = CHORDS_JSON;
    const container = document.getElementById('lyrics-container');
    const charW = getCharWidth();

    // Group chords by line
    const chordsByLine = {};
    chords.forEach(c => {
        if (!chordsByLine[c.lineIndex]) chordsByLine[c.lineIndex] = [];
        chordsByLine[c.lineIndex].push(c);
    });

    // Collect unique chord names (in order of appearance)
    const usedChordsSet = new Set();
    chords.forEach(c => usedChordsSet.add(c.chord));
    const usedChords = [...usedChordsSet];

    // Render chord diagrams
    if (usedChords.length > 0) {
        document.getElementById('chord-shapes-section').style.display = '';
        const refContainer = document.getElementById('chord-ref-container');
        usedChords.forEach(name => {
            const def = CHORD_DB[name];
            if (!def) return;

            const card = document.createElement('div');
            card.className = 'chord-card';

            const title = document.createElement('div');
            title.className = 'chord-name';
            title.textContent = name;
            card.appendChild(title);

            const drawArea = document.createElement('div');
            card.appendChild(drawArea);
            refContainer.appendChild(card);

            vexchords.draw(drawArea, { name, ...def }, {
                width: 80, height: 100,
                defaultColor: '#A0A0A0', strokeColor: '#A0A0A0',
                textColor: '#E0E0E0', stringColor: '#555555',
                fretColor: '#555555', bgColor: '#1A1A1A',
                labelColor: '#E24B4A', showTuning: false
            });
        });
    }

    // Render strumming pattern
    if (STRUM_PATTERN) {
        const strumDisplay = document.getElementById('strum-display');
        if (strumDisplay) {
            const chars = STRUM_PATTERN.split('');
            chars.forEach(ch => {
                const span = document.createElement('span');
                const upper = ch.toUpperCase();
                if (upper === 'D') {
                    span.className = 'strum-d';
                    span.textContent = 'D';
                } else if (upper === 'U') {
                    span.className = 'strum-u';
                    span.textContent = 'U';
                } else if (upper === '-' || upper === 'X') {
                    span.className = 'strum-x';
                    span.textContent = '—';
                } else {
                    span.textContent = ch;
                }
                strumDisplay.appendChild(span);
            });
        }
    }

    // Render lyrics with chords
    let currentSection = null;
    let sectionDiv = null;

    lines.forEach((line, idx) => {
        if (isSectionLine(line)) {
            // Start new section
            sectionDiv = document.createElement('div');
            sectionDiv.className = 'section';

            const label = document.createElement('p');
            label.className = 'section-label';
            label.textContent = parseSectionName(line);
            sectionDiv.appendChild(label);

            container.appendChild(sectionDiv);
            currentSection = parseSectionName(line);
            return;
        }

        // Empty lines — skip but don't break section
        if (line.trim() === '') return;

        // Ensure we have a section div
        if (!sectionDiv) {
            sectionDiv = document.createElement('div');
            sectionDiv.className = 'section';
            container.appendChild(sectionDiv);
        }

        const block = document.createElement('div');
        block.className = 'line-block';

        // Chord row
        const lineChords = chordsByLine[idx];
        if (lineChords && lineChords.length > 0) {
            const chordRow = document.createElement('div');
            chordRow.className = 'chord-row';

            lineChords.sort((a, b) => a.charIndex - b.charIndex);
            lineChords.forEach(c => {
                const span = document.createElement('span');
                span.className = 'chord-cell';
                span.style.left = (c.charIndex * charW) + 'px';
                span.textContent = c.chord;
                chordRow.appendChild(span);
            });

            block.appendChild(chordRow);
        }

        // Lyric row
        const lyricRow = document.createElement('div');
        lyricRow.className = 'lyric-row';
        if (lineChords && lineChords.length > 0) {
            lyricRow.style.marginTop = '20px';
        } else {
            lyricRow.style.marginTop = '0';
        }
        lyricRow.textContent = line;
        block.appendChild(lyricRow);

        sectionDiv.appendChild(block);
    });

    // Footer legend
    if (usedChords.length > 0) {
        const legend = document.getElementById('footer-legend');
        const wrap = document.createElement('div');
        wrap.style.display = 'flex';
        wrap.style.gap = '16px';
        wrap.style.flexWrap = 'wrap';

        usedChords.forEach(name => {
            const item = document.createElement('div');
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.gap = '6px';

            const chordSpan = document.createElement('span');
            chordSpan.className = 'legend-chord';
            chordSpan.textContent = name;
            item.appendChild(chordSpan);

            const nameSpan = document.createElement('span');
            nameSpan.textContent = CHORD_NAMES_FULL[name] || name;
            item.appendChild(nameSpan);

            wrap.appendChild(item);
        });

        legend.appendChild(wrap);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initViewer);
} else {
    initViewer();
}
