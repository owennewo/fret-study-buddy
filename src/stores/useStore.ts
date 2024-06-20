import { defineStore } from 'pinia';
import { ref, watch, type Ref } from 'vue';
import * as Tone from 'tone';
import { KEYS, MODES, POSITIONS, TUNINGS } from '../interfaces/music';
import type { Options, Note, Score } from '../interfaces/music';
import { generateScore } from '../composables/useGenerator';

export const useStore = defineStore('score', () => {
    const options = ref<Options>({
        key: KEYS[0],
        mode: MODES[0],
        position: POSITIONS[0],
        tuning: TUNINGS[0],
        bpm: 120,
    });

    const score: Ref<Score> = ref(generateScore(options.value));

    watch(options, (newOptions) => {
        console.log('Generating new score...', newOptions);
        score.value = generateScore(newOptions);
    }, {
        deep: true,
    });

    return {
        options,
        score,
    };
});

