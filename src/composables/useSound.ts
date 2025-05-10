import * as Tone from 'tone'
import { nextTick, ref, toRaw, watch, onMounted, onUnmounted } from 'vue'
import { VoiceElement } from '@/models/VoiceElement'
import type { Voice } from '@/models/Voice'
import type { Track } from '@/models/Track'
import { Bar } from '@/models/Bar'
import { useCursor } from './useCursor'
import { useCanvas } from './useCanvas'

export const useSound = () => {
  const { score, trackId, barId, elementId, selection, tempoPercent, isPlaybackLooping } = useCursor()
  // Import useCanvas but don't destructure drawScore since we don't need to call it manually anymore
  const isPlaying = ref(false)
  const currentTime = ref(0) // Add a ref to store the current time
  let cacheSelection: Set<Bar | VoiceElement> = new Set([])
  let part: Tone.Part
  let instrument: Tone.Sampler

  Tone.getTransport().on('stop', () => {
    console.log('stop')
  })
  Tone.getTransport().on('start', () => {
    console.log('start')
  })

  Tone.getTransport().on('loopEnd', () => {
    Tone.getTransport().stop()
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

    const sampleName = track.instrument.tone.sampleName
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
        console.log(`Instrument ${track.instrument.name} loaded`)
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
    if (Tone.getTransport().state == 'paused') {
      console.log('resuming')
      isPlaying.value = true

      Tone.getTransport().start()
      return
    }

    const selectedTrack = score.value._tracks[trackId.value]
    instrument = await loadInstrument(selectedTrack)
    console.log(instrument)

    if (part) {
      console.log('disposing previous part')
      part.stop(0)
      part.dispose()
      await Tone.getTransport().stop()
      Tone.getTransport().position = 0
      await Tone.getTransport().cancel(0)
    }

    Tone.getTransport().timeSignature = [score.value.timeSignature.beatsPerBar, score.value.timeSignature.beatValue]
    Tone.getTransport().bpm.value = (score.value.tempo * tempoPercent.value) / 100
    isPlaying.value = true
    await Tone.start()
    console.log('audio is ready')

    Tone.loaded().then(() => {
      console.log('Samples loaded')
      cacheSelection = new Set([...selection.value])
      startPlayback(selectedTrack)
    })
  }

  const startPlayback = (track: Track) => {
    let playedCount = 0

    Tone.getTransport().scheduleRepeat((time) => {
      currentTime.value = Tone.getTransport().seconds
      console.log("time: ", time, Tone.getTransport().state)
    }, "4n");


    const noteTuples = [] as Array<[number, VoiceElement]>
    const nextVoiceTimes = [0, 0, 0, 0]

    track._bars.forEach(bar => {
      if (selection.value.size > 0 && selection.value[0] instanceof Bar && !selection.value.has(toRaw(bar))) {
        return // skips bars not in selection
      }
      bar._voices
        .flatMap((voice: Voice) => voice._elements)
        .forEach((element: VoiceElement) => {
          // debugger
          if (
            selection.value.size > 1 &&
            selection.value[0] instanceof VoiceElement &&
            !selection.value.has(toRaw(element))
          ) {
            return
          } else if (
            selection.value.size == 1 &&
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
            // console.log(`${element.bar().index()}:${element.voice().index()}:${element.index()} ${time}`)
            let event = {
              element: element,
              time: time,
            }

            noteTuples.push([time, event])
          }
          let duration = element.beatDuration()
          if (element.isLast()) {
            // This fixes bars that have missing elements
            const voiceDuration = element.voice().duration()
            const barDuration = element.bar().timeSignature.beatsPerBar
            const remainingDuration = barDuration - voiceDuration
            if (remainingDuration > 0) {
              duration += remainingDuration
            }
          }
          nextVoiceTimes[element.voice().index()] +=
            duration * Tone.Time(`${bar.timeSignature.beatsPerBar}n`).toSeconds()
        })
    })

    part = new Tone.Part((time, event: VoiceElement) => {
      const element = event.element
      const duration = element.beatDuration()

      // Collect all pitches for the chord
      const pitches = element._notes
        .filter(note => !isNaN(note.fret)) // Ensure valid notes
        .map(note => note.pitch()) // Map to their pitches

      if (pitches.length > 0) {
        // Trigger the chord with all pitches
        instrument.triggerAttackRelease(pitches, duration, time)
        // debugger
        selection.value = new Set([toRaw(element)])

        // Schedule visual updates for the chord
        Tone.Draw.schedule(() => {
          setTimeout(
            () => {
              // debugger
              selection.value = new Set() // Clear selection to trigger redraw
              playedCount += 1
              if (playedCount === noteTuples.length) {
                console.log('ENDED')
                selection.value = cacheSelection //.map(item => toRaw(item))
                isPlaying.value = false
                Tone.getTransport().stop()

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

    const noteEndTimes = part._events.values().map(event => {

      const startTime = Tone.Time(event.value.time).toSeconds();
      const duration = Tone.Time(event.value.element.beatDuration()).toSeconds(); // default to 0 if no duration provided
      return startTime + duration;
    });
    const partLength = Math.max(...noteEndTimes);
    console.log('partLength', partLength)

    part.start(0)

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
    currentTime, // Export currentTime
  }
}
