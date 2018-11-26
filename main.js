function identity(n) {
    return n;
}

function brownNoise(e) {
    var white;
    var lastOut = 0;
    var output = e.outputBuffer.getChannelData(0);
    for (var i = 0; i < e.outputBuffer.length; i++) {
        white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5; // (roughly) compensate for gain
    }
    return output;
}

function makeTrack(seq) {
    let notes = new Array(seq.resolution);
    notes = notes.fill(null);
    return { notes: notes };
}

function addTrack(seq, track) {
    track = track || makeTrack(seq)
    seq.tracks.push(track);
    return seq;
}

function addTracks(seq, num) {
    while(num--) {
        seq = addTrack(seq);
    }
    return seq;
}

function makeSequence(resolution, bpm) {
    return {
        resolution: resolution,
        bpm: bpm,
        playhead: 0,
        started: null,
        state: 'paused',
        tracks: []
    }
}

function sumCols(tr) {
    var children = Array.from(tr.children);
    var total = 0;
    console.log(children.reduce(function(acc, tr) { 
        return acc + parseInt(tr.getAttribute('colspan') || 1) 
    }, 0))
}

function sumExtra(seq, index) {
    return seq.slice(0, index).filter(identity).reduce(function(acc, note) {
        return acc + note.dur - 1;
    }, 0)
}

function renderNotes(notes, playhead, tracknum) {
    var adjustedPlayhead = playhead;
    var extra = 0;
    var accExtra = 0;
    var renderedNotes = [];
    var note;
    found = false;
    for (var i = 0; i < notes.length; i++) {
        note = notes[i];
        var attrs = {colspan: 1, 'class': ''}
        if (note) {
            attrs.colspan = note.dur;
            extra = note.dur - 1;
            accExtra = accExtra + extra;
        }
        if ((i == playhead || i + accExtra >= playhead) && !found) {
            attrs.class = "playing";
            found = true;
        }
        renderedNotes.push(dumb("td", attrs, [["text", i]]));
    }
    return renderedNotes;
}

function renderTrack(track, playhead, i) {
    let children = renderNotes(track.notes, playhead, i)
    return dumb("tr", children)
}

function renderSequence(seq) {
    let children = seq.tracks.map(function(track, i) { 
        return renderTrack(track, seq.playhead, i) 
    });
    return dumb("table", children);
}

function step(seq) {
    seq.playhead++;
    if (seq.playhead >= seq.resolution) {
        seq.playhead = 0;
    }
    return seq.playhead;
}

function playNote(note, bpm) {
    var sound = new Pizzicato.Sound({
        source: 'script',
        options: { audioFunction: note.sound }
    });
    sound.play();
    setTimeout(function() {
        sound.stop();
    }, seconds(note.dur, bpm))
}

function playTrackAt(track, index, bpm) {
    if (track.notes[index]) playNote(track.notes[index], bpm);
}

function seconds(dur, bpm) {
    return (60 / bpm) * (dur * 1000);
}

function play(seq, index) {
    if (stop) {
        return;
    }
    seq.tracks.forEach(function(track) {
        playTrackAt(track, index, seq.bpm);
    });
    document.body.innerHTML = "";
    document.body.appendChild(renderSequence(seq))
    setTimeout(function() {
        play(seq, step(seq));
    }, (60 / seq.bpm) * 1000 );
}

function stepAndRender(seq) {
    step(seq);
    document.body.innerHTML = "";
    document.body.appendChild(renderSequence(seq))
}

function _fillTest(seq) {
    seq.tracks[0].notes[2] = {dur: 3, sound: brownNoise}
    seq.tracks[0].notes[4] = {dur: 4, sound: brownNoise}
    seq.tracks[0].notes = seq.tracks[0].notes.slice(0, 27);
    console.log(seq.tracks[0].notes.reduce(function(acc, note) { return acc + (note ? note.dur : 1) }, 0))
    console.log(seq);
}

let seq = makeSequence(32, 40);
seq = addTracks(seq, 2);

_fillTest(seq)
document.body.appendChild(renderSequence(seq))

// play(seq, seq.playhead);
