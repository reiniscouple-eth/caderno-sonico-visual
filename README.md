# Sonic-Visual Notebook (Caderno Sônico-Visual)

## Concept

The "Sonic-Visual Notebook" is an interactive digital artwork that explores the dynamic relationship between sound and image. It aims to transform the viewer into an active participant by using ambient sound, particularly the user's own voice or sounds, to generate abstract visuals and responsive soundscapes in real-time.

The screen acts as a digital "notebook" where incoming sound "draws," and the artwork "responds" both visually and sonically. This creates a unique, synesthetic experience for each interaction, fostering a sense of "conversation" or "dialogue" between the user and the piece through a sensory interplay.

## How it Works

This artwork is built using **p5.js** and the **p5.Sound** library.

1.  **Audio Input:** It uses the device's microphone (requesting user permission via the `getUserMedia` API) to capture ambient sound.
2.  **Real-time Audio Analysis:** The incoming audio is analyzed in real-time using p5.Sound functions:
    * **Amplitude:** Measures the overall volume/loudness of the sound.
    * **FFT (Fast Fourier Transform):** Analyzes the frequency spectrum (distribution of bass, mids, treble).
    * **Centroid:** Calculates the weighted average frequency, giving an idea of the sound's "brightness".
3.  **Visual Generation:** Abstract visuals (particles, shapes, colors) are generated and manipulated based on the audio analysis:
    * **Amplitude** often influences the size, brightness, or expansion of visual elements. Louder sounds create larger or more vibrant visuals.
    * **Frequency Bands (Bass, Mid, Treble)** influence colors, position, or movement patterns. For instance, lower frequencies might generate warmer colors near the bottom, while higher frequencies generate cooler colors near the top.
    * **Overall Energy/Volume** affects the background brightness and the general activity level of the visuals.
    * **Silence:** During periods of silence, the visuals transition smoothly to a resting state, resembling an empty notebook.
4.  **Sound Generation (Response):** The artwork generates its own sounds as a response to the input, creating an auditory dialogue:
    * An **Oscillator** produces tones whose frequency and amplitude are modulated by the input sound's characteristics (like centroid and volume).
    * A **Noise Generator** adds textural sound layers, potentially triggered by specific frequency ranges (like treble).
    * **Effects (Delay and Reverb)** are applied to the generated sounds, with parameters (like feedback, delay time, mix level) modulated by the input audio analysis (like bass energy or total energy).
    * During silence, the generated sounds fade out smoothly.

## Features

* **Interactive:** Directly responds to microphone input in real-time.
* **Generative:** Creates unique visual and sonic output based on live audio data.
* **Synesthetic:** Maps audio features (volume, frequency) to visual attributes (size, color, position) and generative sound parameters.
* **Responsive Design:** The canvas adapts to the browser window size, making it suitable for various displays (desktops, projections, potentially mobile with performance considerations).
* **Resting State:** Transitions to a calm visual and sonic state during silence.

## How to Run

1.  **Clone or Download:** Get the project files (`index.html`, `sketch.js`).
2.  **File Structure:** Ensure `index.html` and `sketch.js` are in the same directory.
3.  **Web Server (Recommended):** For microphone access (`getUserMedia`), browsers often require the page to be served over HTTPS or from `localhost`.
    * You can use simple local server tools like Python's `http.server` (`python -m http.server` in the project directory) or Node.js modules like `live-server`.
    * Alternatively, use web-based p5.js editors like the [p5.js Web Editor](https://editor.p5js.org/).
4.  **Open:** Access the `index.html` file through your local server's address (e.g., `http://localhost:8000`) or directly in a compatible browser if local file access works for microphone input (less common now).
5.  **Interact:** Click or tap the initial message to grant microphone permission and start the audio context. Make sounds!

## Dependencies

* [p5.js](https://p5js.org/) (Core library)
* [p5.Sound](https://p5js.org/reference/#/libraries/p5.sound) (Audio processing library)
    * Both are loaded via CDN links in the `index.html` file, so no local installation is needed besides having the project files.

## Potential Future Enhancements

* More complex visual mapping (e.g., using `beginShape`/`endShape`, textures).
* More sophisticated sound generation (e.g., granular synthesis, triggering pre-loaded samples).
* Different analysis techniques (e.g., pitch detection, beat detection).
* User controls to adjust sensitivity or visual/sonic parameters.
* Optimization for smoother performance on mobile devices.

## License

MIT License
