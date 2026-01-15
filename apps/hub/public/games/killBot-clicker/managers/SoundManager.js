import * as Tone from 'tone';

export default class SoundManager {
    constructor() {
        this.isInitialized = false;
        this.synth = null;
        this.noise = null;
    }

    async init() {
        if (this.isInitialized) return;
        
        await Tone.start();
        
        // Base Synth for clicks/UI
        this.synth = new Tone.PolySynth(Tone.Synth).toDestination();
        this.synth.set({
            oscillator: { type: "sine" },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.1 }
        });

        // Noise for mining/breaches
        this.noise = new Tone.NoiseSynth({
            noise: { type: "white" },
            envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.1 }
        }).toDestination();

        this.isInitialized = true;
    }

    playClick(isCrit = false) {
        if (!this.isInitialized) return;
        
        if (isCrit) {
            this.synth.triggerAttackRelease("C5", "16n");
            this.synth.triggerAttackRelease("E5", "16n", "+0.05");
            this.noise.triggerAttackRelease("16n", "+0.02", 0.3);
        } else {
            this.synth.triggerAttackRelease("G4", "32n", undefined, 0.4);
            this.noise.triggerAttackRelease("32n", undefined, 0.1);
        }
    }

    playUI(type = 'success') {
        if (!this.isInitialized) return;
        
        if (type === 'success') {
            this.synth.triggerAttackRelease(["C4", "E4", "G4"], "8n");
        } else if (type === 'error') {
            this.synth.triggerAttackRelease(["C3", "Db3"], "4n");
        } else if (type === 'discovery') {
             this.synth.triggerAttackRelease(["F4", "A4", "C5", "F5"], "2n");
        } else if (type === 'strike') {
            const noise = new Tone.NoiseSynth().toDestination();
            noise.envelope.attack = 0.1;
            noise.envelope.decay = 2;
            noise.triggerAttackRelease(2);
        }
    }

    playAmbient() {
        if (!this.isInitialized) return;
        
        // Very low volume ambient hum
        const osc = new Tone.Oscillator(55, "sine").toDestination();
        osc.volume.value = -30;
        osc.start();
        
        const lfo = new Tone.LFO("0.1hz", 50, 60).connect(osc.frequency);
        lfo.start();

        this.startStupidSynthMusic();
    }

    startStupidSynthMusic() {
        // Bass Synth
        const bassSynth = new Tone.MonoSynth({
            oscillator: { type: "square" },
            envelope: { attack: 0.05, decay: 0.2, sustain: 0.4, release: 0.1 },
            filterEnvelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1, baseFrequency: 200, octaves: 2.6 }
        }).toDestination();
        bassSynth.volume.value = -18;

        // Lead Synth (The "Stupid" Chirpy one)
        const leadSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "pulse" },
            envelope: { attack: 0.02, decay: 0.1, sustain: 0.2, release: 0.5 }
        }).toDestination();
        leadSynth.volume.value = -16;

        // Add a bit of "stupidity" (vibrato/unsteadiness)
        const vibrato = new Tone.Vibrato(5, 0.1).toDestination();
        leadSynth.connect(vibrato);

        // Simple Drum (Noise for hats)
        const drum = new Tone.NoiseSynth({
            volume: -25,
            envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 }
        }).toDestination();

        const bassLoop = new Tone.Sequence((time, note) => {
            bassSynth.triggerAttackRelease(note, "8n", time);
        }, ["C2", "C2", "G1", "C2", "F1", "F1", "G1", "B1"], "8n");

        const melodyLoop = new Tone.Sequence((time, note) => {
            if (note) leadSynth.triggerAttackRelease(note, "16n", time);
        }, [
            "C4", "E4", "G4", "B4", "C5", null, "G4", "E4",
            "F4", "A4", "C5", "E5", "D5", null, "B4", "G4",
            "C4", "G3", "C4", "E4", "G4", "C5", "E5", "G5",
            "F5", "D5", "B4", "G4", "F4", "D4", "B3", "G3"
        ], "16n");

        const drumLoop = new Tone.Sequence((time) => {
            drum.triggerAttackRelease("32n", time);
        }, [1, null, 1, null, 1, null, 1, null], "8n");

        Tone.Transport.bpm.value = 135;
        
        bassLoop.start(0);
        melodyLoop.start(0);
        drumLoop.start(0);
        
        Tone.Transport.start();
    }
}