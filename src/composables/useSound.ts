// src/composables/useSound.ts
import * as Tone from 'tone';
import { useStore } from '../stores/useStore';

export const useSound = () => {

    const { options, score } = useStore();

    let part: Tone.Part;
    let sampler: Tone.Sampler;

    const startAudio = async () => {
        console.log("audio is starting");

        if (part) {
            console.log("disposing previous part");
            part.stop(0);
            part.dispose();
            await Tone.Transport.stop();
            Tone.Transport.position = 0;
            await Tone.Transport.cancel(0);
        }

        if (sampler) {
            sampler.dispose();
        }

        Tone.Transport.bpm.value = options.bpm;

        await Tone.start();
        console.log("audio is ready");

        sampler = new Tone.Sampler({
            urls: {
                A2: "guitar_Astring.mp3",
                B3: "guitar_Bstring.mp3",
                D3: "guitar_Dstring.mp3",
                G3: "guitar_Gstring.mp3",
                E4: "guitar_highEstring.mp3",
                E2: "guitar_LowEstring2.mp3",
            },
            baseUrl: "https://tonejs.github.io/audio/berklee/",
            onload: () => {
                console.log("starting play");

                part = new Tone.Part((time, note) => {
                    const duration = "4n";
                    Tone.Draw.schedule(() => {
                        note.active = true;
                        setTimeout(() => {
                            note.active = false;
                        }, Tone.Time(duration).toMilliseconds());
                    }, time);

                    sampler.triggerAttackRelease(note.keyOctave, duration, time);
                }, score.bars.flatMap(bar => bar.notes).map((note, index) => {
                    const t = index * Tone.Time("4n").toSeconds();
                    return [t, note];
                }));

                part.start(0);
                Tone.Transport.start();
                console.log("done");
            }
        }).toDestination();
    };

    return {
        startAudio,
    };
};
