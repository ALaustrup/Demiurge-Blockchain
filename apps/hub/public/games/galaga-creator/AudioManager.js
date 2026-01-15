import * as Tone from 'tone';

class AudioManager {
    constructor() {
        this.synth = new Tone.PolySynth(Tone.Synth).toDestination();
        this.bass = new Tone.MonoSynth({
            oscillator: { type: 'sawtooth' },
            envelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 0.8 }
        }).toDestination();
        
        this.noise = new Tone.NoiseSynth().toDestination();

        // Music Loop
        this.loop = new Tone.Loop((time) => {
            this.bass.triggerAttackRelease("C2", "8n", time);
            this.bass.triggerAttackRelease("G1", "8n", time + Tone.Time("4n"));
        }, "2n");

        this.melodyLoop = new Tone.Loop((time) => {
            const notes = ["C4", "Eb4", "G4", "Bb4"];
            const note = notes[Math.floor(Math.random() * notes.length)];
            this.synth.triggerAttackRelease(note, "16n", time);
        }, "8n");

        Tone.Transport.bpm.value = 100;
    }

    startMusic() {
        if (Tone.context.state !== 'running') {
            Tone.start();
        }
        Tone.Transport.start();
        this.loop.start(0);
        this.melodyLoop.start(0);
    }

    stopMusic() {
        Tone.Transport.stop();
        this.loop.stop();
        this.melodyLoop.stop();
    }
    updateSpeedContinuous(playTime) {
        const minutes = playTime / 60000;
        const newBpm = Math.min(200, 100 + (minutes * 3));
        Tone.Transport.bpm.rampTo(newBpm, 2);
    }

    playShoot() {
        try {
            this.synth.triggerAttackRelease("C5", "32n", Tone.now());
        } catch (e) { }
    }

    playHit() {
        if (this.lastHitTime === Tone.now()) return;
        this.lastHitTime = Tone.now();
        try {
            this.noise.triggerAttackRelease("16n", Tone.now());
        } catch (e) { }
    }

    playCoin() {
        try {
            const now = Tone.now();
            this.synth.triggerAttackRelease("G5", "16n", now);
            this.synth.triggerAttackRelease("C6", "16n", now + 0.1);
        } catch (e) { }
    }

    playExplosion() {
        if (this.lastExplosionTime === Tone.now()) return;
        this.lastExplosionTime = Tone.now();
        try {
            this.noise.triggerAttackRelease("4n", Tone.now());
        } catch (e) { }
    }
}

export const audioManager = new AudioManager();
