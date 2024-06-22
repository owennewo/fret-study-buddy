import Artyom from "artyom.js";
const artyom = new Artyom();
// declare var Artyom: any;

var commandHello = {
    indexes: ["hello", "good morning", "hey"], // These spoken words will trigger the execution of the command
    action: function () { // Action to be executed when a index match with spoken word
        console.log("Hello buddy ! How are you today?")
        try {
            artyom.say("Hey buddy! How are you today?", {
                onStart: function () {
                    console.log("Speech started");
                },
                onEnd: function () {
                    console.log("Speech ended");
                }
            });
        } catch (error) {
            console.error("Error during speech synthesis:", error);
        }
    }
};

artyom.addCommands(commandHello);
var errorObject = artyom.detectErrors();

console.log("artyom errors", errorObject);

export const useSpeech = () => {

    const startContinuousArtyom = () => {
        console.log("startContinuousArtyom")
        artyom.fatality();// use this to stop any of

        setTimeout(function () {// if you use artyom.fatality , wait 250 ms to initialize again.
            console.log("Artyom succesfully stopped !");
            artyom.initialize({
                lang: "en-US",// A lot of languages are supported. Read the docs !
                continuous: true,// Artyom will listen forever
                listen: true, // Start recognizing
                debug: true, // Show everything in the console
                volume: 10,
                speed: 1 // talk normally

            }).then(function () {
                console.log("Ready to work !");
                debugger;
                artyom.say("Hey buddy! How are you today?", {
                    onStart: function () {
                        console.log("Speech started");
                    },
                    onEnd: function () {
                        console.log("Speech ended");
                    }
                });
            }).catch((err) => {
                console.log(err);
            });
            console.log("Artyom has been succesfully initialized !");
        }, 250);
    }
    return { startContinuousArtyom }

}