import * as Tone from 'tone'
// import { useIndexedDBStore } from '@/stores/useIndexedDBStore'
import { ref, toRefs } from 'vue'
import { timeMillisecond } from 'd3'
import type { VoiceElement } from '@/models/VoiceElement'
import type { Voice } from '@/models/Voice'
import type { Track } from '@/models/Track'
import type { Bar } from '@/models/Bar'
import { useCursor } from './useCursor'

export const useSound = () => {
  const { score } = toRefs(useCursor())
  // const { score } = toRefs(useIndexedDBStore())
  const isPlaying = ref(false)

  let part: Tone.Part
  let instrument: Tone.Sampler

  Tone.getTransport().on('stop', () => {
    console.log('stop')
  })
  Tone.getTransport().on('loopEnd', () => {
    console.log('loopEnd')
  })
  Tone.getTransport().on('pause', () => {
    console.log('pause')
  })

  Tone.getTransport().on('loop', () => {
    console.log('loop')
  })

  const loadInstrument = async (track: Track) => {
    const samples = track.instrument.tone.samples
    // const strings = instruments[instrumentName].tunings[tuningName].samples;

    const sampleName = track.instrument.tone.name
    const sampleUrls = samples.reduce((acc: object, item) => {
      const filename = item.replace('#', 's') // d# -> ds
      // these urls are specific to nbrowsky sample folder structure and filename
      return Object.assign(acc, { [item]: `${filename}.mp3` })
    }, {} as any)

    console.log('sampleUrls', sampleUrls)
    const sampler = new Tone.Sampler({
      urls: sampleUrls,
      baseUrl: `https://nbrosowsky.github.io/tonejs-instruments/samples/${sampleName}/`,
      attack: 0.01,
      release: 0.2,
      onload: async () => {
        // await sampler.loaded;
        // startPlayback();
        console.log(`Instrument ${track.instrument.instrumentName} loaded`)
      },
    }).toDestination()
    await Tone.loaded()
    return sampler
  }

  const play = async event => {
    if (Tone.Transport.state == 'paused') {
      console.log('resuming')
      isPlaying.value = true
      Tone.Transport.start()
      return
    }

    const selectedTrack = score.value.tracks[0]
    instrument = await loadInstrument(selectedTrack)
    console.log(instrument)

    if (part) {
      console.log('disposing previous part')
      part.stop(0)
      part.dispose()
      await Tone.Transport.stop()
      Tone.Transport.position = 0
      await Tone.Transport.cancel(0)
    }

    Tone.Transport.timeSignature = [
      score.value.timeSignature.beatsPerBar,
      score.value.timeSignature.beatValue,
    ]
    Tone.Transport.bpm.value = score.value.tempo
    isPlaying.value = true
    await Tone.start()
    console.log('audio is ready')

    Tone.loaded().then(() => {
      console.log('Samples loaded')
      startPlayback(selectedTrack)
    })
  }

  const startPlayback = (track: Track) => {
    const start = timeMillisecond()
    let playedCount = 0

    const noteTuples = track.bars.reduce(
      (tuples: Array<[number, any]>, bar: Bar, bar_index) => {
        bar.voices
          .flatMap((voice: Voice) => voice.elements)
          .flat()
          .map((element: VoiceElement, element_index) => {
            if (!element.isRest()) {
              const time =
                (element.location() +
                  bar_index * bar.timeSignature.beatsPerBar) *
                Tone.Time(`${bar.timeSignature.beatsPerBar}n`).toSeconds()
              tuples.push([time, element])
            }
          })
        // tuples.push([0, 'end'])
        return tuples
      },
      [] as Array<[number, any]>,
    )

    part = new Tone.Part((time, element: VoiceElement) => {
      const duration = element.duration
      element.notes
        .filter(note => !isNaN(note.fretNumber))
        .forEach(note => {
          // const keyIndex = toNoteIndex(base) + note.fretNumber
          const pitch = note.pitch()
          instrument.triggerAttackRelease(pitch, duration, time)
          Tone.Draw.schedule(() => {
            note.active = true
            setTimeout(
              () => {
                note.active = false
                playedCount += 1
                if (playedCount == noteTuples.length) {
                  console.log('ENDED')
                  isPlaying.value = false
                }
              },
              duration * Tone.Time('4n').toMilliseconds(),
            )
          }, time)
        })
    }, noteTuples)

    part.start(0)
    // part.loop = true

    Tone.getTransport().start()
    console.log('done')
  }

  const pause = () => {
    isPlaying.value = false
    Tone.getTransport().pause()
  }

  return {
    play,
    pause,
    isPlaying,
  }
}
