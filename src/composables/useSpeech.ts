// import Artyom from "artyom.js";
import { type Ref } from 'vue';
import type { Options, } from "../interfaces/music";
import { useSound } from '../composables/useSound';
import type { Mode } from '../interfaces/music'
import { MODES } from '../interfaces/music'


declare var Artyom: any;
const artyom = new Artyom();


var errorObject = artyom.detectErrors();

console.log("artyom errors", errorObject);

const numberMapping: { [key: string]: number } = {
    "zero": 0,
    "open": 0,
    "one": 1,
    "first": 1,
    "two": 2,
    "second": 2,
    "three": 3,
    "third": 3,
    "for": 4,
    "four": 4,
    "fourth": 4,
    "five": 5,
    "fifth": 5,
    "six": 6,
    "sixth": 6,
    "seven": 7,
    "seventh": 7,
    "eight": 8,
    "eighth": 8,
    "nine": 9,
    "ninth": 9,
    "ten": 10,
    "tenth": 10,
    "eleven": 11,
    "eleventh": 11,
    "twelve": 12,
    "twelth": 12
};

const keyMapping: { [key: string]: number } = {
    "c": 0,
    "see": 0,
    "charlie": 0,
    "c sharp": 1,
    "charlie sharp": 1,
    "d": 2,
    "delta": 2,
    "d sharp": 3,
    "delsta sharp": 3,
    "e": 4,
    "echo": 4,
    "e sharp": 5,
    "echo sharp": 5,
    "f": 6,
    "foxtrot": 6,
    "f sharp": 7,
    "foxtrot sharp": 7,
    "g": 8,
    "gamma": 8,
    "g sharp": 9,
    "gamma sharp": 9,
    "a": 10,
    "alpha": 10,
    "a sharp": 11,
    "alpha sharp": 11,
    "b": 12,
    "bravo": 12
};

const findMode = (speechMode: string) => {
    const foundMode = MODES.find((mode: Mode) =>
        mode.modeName.toLocaleLowerCase() === speechMode ||
        mode.name.toLocaleLowerCase() === speechMode
    );
    return foundMode ? foundMode.index : undefined;
};



export const useSpeech = (options: Ref<Options>, divRef: Ref<HTMLDivElement | null>) => {
    const { play } = useSound();

    var commandHello = {
        indexes: ["hello", "good morning", "hey"], // These spoken words will trigger the execution of the command
        action: function () { // Action to be executed when a index match with spoken word
            console.log("Hello buddy ! How are you today?")
        }
    };

    var commandBPM = {
        indexes: ["bpm *", "beats *", "beets *", "speed *"], // These spoken words will trigger the execution of the command
        smart: true,
        action: function (i: number, wildcard: string) { // Action to be executed when a index match with spoken word
            // console.log("bpm", i, wildcard)
            if (wildcard) {
                const first = wildcard.split(" ")[0];
                if (!isNaN(Number(first)) && isFinite(Number(first))) {
                    const bpm = parseInt(wildcard.split(" ")[0]);
                    console.log("BPM is", bpm)
                    options.value.bpm = bpm;
                } else {
                    console.log("BPM is not a number", wildcard)
                }
            } else {
                console.log("BPM is not defined")
            }
        }
    };


    var commandKey = {
        indexes: ["key *", "scale *"], // These spoken words will trigger the execution of the command
        smart: true,
        action: function (i: number, wildcard: string) { // Action to be executed when a index match with spoken word
            if (wildcard) {
                const words = wildcard.split(" ");

                const keyString = (words.length > 1) ? words[0] + " " + words[1] : words[0];

                const keyIndex = keyMapping[keyString]
                if (keyIndex !== undefined) {
                    console.log("key is", keyIndex)
                    options.value.key = keyIndex;
                } else {
                    console.log("key is undefined", wildcard)
                }
            } else {
                console.log("key is not defined")
            }
        }
    };

    var commandMode = {
        indexes: ["made *", "mode *", "* mode", "* made"], // These spoken words will trigger the execution of the command
        smart: true,
        action: function (i: number, wildcard: string) { // Action to be executed when a index match with spoken word
            if (wildcard) {
                const words = wildcard.split(" ");

                const modeString = (words.length > 1) ? words[0] + " " + words[1] : words[0];

                const modeIndex = findMode(modeString)
                if (modeIndex !== undefined) {
                    console.log("mode is", modeIndex)
                    options.value.mode = modeIndex;
                } else {
                    console.log("mode is undefined", wildcard)
                }
            } else {
                console.log("mode is not defined")
            }
        }
    };

    var commandPlay = {
        indexes: ["play"], // These spoken words will trigger the execution of the command
        action: function () { // Action to be executed when a index match with spoken word
            console.log("play")
            play();
        }
    };

    var commandPosition = {
        indexes: ["position *", "* position"], // These spoken words will trigger the execution of the command
        smart: true,
        action: function (i: number, wildcard: string) { // Action to be executed when a index match with spoken word
            if (wildcard) {
                const first = wildcard.split(" ")[0];
                if (!isNaN(Number(first)) && isFinite(Number(first))) {
                    const position = parseInt(wildcard.split(" ")[0]);
                    console.log("Position is", position)
                    options.value.position = position;
                } else {
                    const position = numberMapping[first];
                    if (!isNaN(Number(position)) && isFinite(Number(position))) {
                        console.log("Position is", position)
                        options.value.position = position;
                    } else {
                        console.log("Position is not a number", wildcard, position)
                    }

                }

            } else {
                console.log("Position is not defined")
            }
        }
    };

    artyom.emptyCommands();
    artyom.addCommands(commandHello);
    artyom.addCommands(commandBPM);
    artyom.addCommands(commandPosition);
    artyom.addCommands(commandKey);
    artyom.addCommands(commandPlay);
    artyom.addCommands(commandMode);
    artyom.redirectRecognizedTextOutput((recognized: any, isFinal: boolean) => {
        if (isFinal) {
            console.log(`Final recognized text: ${recognized}`);
            divRef.value!.textContent = recognized;
            // } else {
            //     console.log(`Interim recognized text: ${recognized}`);
        }
    });

    const startContinuousArtyom = () => {
        console.log("startContinuousArtyom")
        artyom.fatality();// use this to stop any of

        setTimeout(function () {// if you use artyom.fatality , wait 250 ms to initialize again.
            console.log("Artyom succesfully stopped !");
            artyom.initialize({
                lang: "en-US",// A lot of languages are supported. Read the docs !
                continuous: true,// Artyom will listen forever
                listen: true, // Start recognizing
                // debug: true, // Show everything in the console
                volume: 10,
                speed: 1 // talk normally

            }).then(function () {
                console.log("Ready to work !");
                divRef.value!.textContent = "Ready"
                artyom.say("Hey buddy! How are you today?", {
                    onStart: function () {
                        console.log("Speech started");
                    },
                    onEnd: function () {
                        console.log("Speech ended");
                    }
                });
            }).catch((err: any) => {
                divRef.value!.textContent = "Error"
                console.log(err);
            });
            console.log("Artyom has been succesfully initialized !");
        }, 250);
    }
    return { startContinuousArtyom }

}