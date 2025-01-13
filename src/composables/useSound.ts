import * as Tone from 'tone'
import { nextTick, ref, toRaw } from 'vue'
import { VoiceElement } from '@/models/VoiceElement'
import type { Voice } from '@/models/Voice'
import type { Track } from '@/models/Track'
import { Bar } from '@/models/Bar'
import { useCursor } from './useCursor'
import { useCanvas } from './useCanvas'

export const useSound = () => {
  const { score, trackId, barId, elementId, selection, tempoPercent, isPlaybackLooping } = useCursor()
  const { drawScore } = useCanvas()
  const isPlaying = ref(false)

  let cacheSelection: Array<Bar | VoiceElement> = []

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
    }, {}) as any

    console.log('sampleUrls', sampleUrls)
    const sampler = new Tone.Sampler({
      urls: sampleUrls,
      baseUrl: `https://nbrosowsky.github.io/tonejs-instruments/samples/${sampleName}/`,
      attack: 0.01,
      release: 0.2,
      onload: async () => {
        console.log(`Instrument ${track.instrument.instrumentName} loaded`)
      },
    }).toDestination()
    await Tone.loaded()
    return sampler
  }

  const togglePlay = async () => {
    if (isPlaying.value) {
      pause()
    } else {
      play()
    }
  }

  const play = async () => {
    if (Tone.Transport.state == 'paused') {
      console.log('resuming')
      isPlaying.value = true
      Tone.Transport.start()
      return
    }

    const selectedTrack = score.value._tracks[trackId.value]
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

    Tone.Transport.timeSignature = [score.value.timeSignature.beatsPerBar, score.value.timeSignature.beatValue]
    Tone.Transport.bpm.value = (score.value.tempo * tempoPercent.value) / 100
    isPlaying.value = true
    await Tone.start()
    console.log('audio is ready')

    Tone.loaded().then(() => {
      console.log('Samples loaded')
      cacheSelection = [...selection.value]
      startPlayback(selectedTrack)
    })
  }

  const startPlayback = (track: Track) => {
    let playedCount = 0

    const noteTuples = [] as Array<[number, VoiceElement]>

    const nextVoiceTimes = [0, 0, 0, 0]

    track._bars.forEach(bar => {
      if (selection.value.length > 0 && selection.value[0] instanceof Bar && !selection.value.includes(toRaw(bar))) {
        return // skips bars not in seletion
      }
      bar._voices
        .flatMap((voice: Voice) => voice._elements)
        .forEach((element: VoiceElement) => {
          // debugger
          if (
            selection.value.length > 1 &&
            selection.value[0] instanceof VoiceElement &&
            !selection.value.includes(toRaw(element))
          ) {
            return
          } else if (
            selection.value.length == 1 &&
            selection.value[0] instanceof VoiceElement &&
            (element.bar().index() < selection.value[0].bar().index() ||
              (element.bar().index() == selection.value[0].bar().index() &&
                element.index() < selection.value[0].index()))
          ) {
            return
          }

          if (!element.isRest()) {
            let time = nextVoiceTimes[element.voice().index()]
            time = Math.round(time * 1000) / 1000;  // round to 3 decimal places
            console.log(`${element.bar().index()}:${element.voice().index()}:${element.index()} ${time}`)
            noteTuples.push([time, element])
          }
          nextVoiceTimes[element.voice().index()] +=
            element.beatDuration() * Tone.Time(`${bar.timeSignature.beatsPerBar}n`).toSeconds()
        })
    })

    part = new Tone.Part((time, element: VoiceElement) => {
      const duration = element.beatDuration()

      // Collect all pitches for the chord
      const pitches = element._notes
        .filter(note => !isNaN(note.fretNumber)) // Ensure valid notes
        .map(note => note.pitch()) // Map to their pitches

      if (pitches.length > 0) {
        // Trigger the chord with all pitches
        instrument.triggerAttackRelease(pitches, duration, time)

        selection.value = [toRaw(element)]
        drawScore()

        // Schedule visual updates for the chord
        Tone.Draw.schedule(() => {
          setTimeout(
            () => {
              playedCount += 1
              if (playedCount === noteTuples.length) {
                console.log('ENDED')
                selection.value = cacheSelection.map(item => toRaw(item))
                drawScore()
                isPlaying.value = false

                if (isPlaybackLooping.value) {
                  nextTick(() => {
                    play()
                  })
                }
              }
            },
            duration * Tone.Time('4n').toMilliseconds(),
          )
        }, time)
      }
    }, noteTuples)

    part.start(0)
    // part.loop = true

    Tone.getTransport().start()
    console.log('done')
  }

  const pause = () => {
    isPlaying.value = false
    Tone.getTransport().pause()
    if (selection.value[0] instanceof VoiceElement) {
      barId.value = selection.value[0].bar().index()
      elementId.value = selection.value[0].index()
    }
  }

  return {
    play,
    pause,
    togglePlay,
    isPlaying,
  }
}
