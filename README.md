# NEURO - VTuber AI Engine

NEURO is a custom AI-powered VTuber system that integrates speech-to-text (STT), text-to-speech (TTS), and interaction with platforms like Discord and OBS. It's powered by Mistral 7B, running locally with Llama.cpp and using custom node.js scripts for various features like game control, voice interaction, and more.

## Getting Started

### Prerequisites

Before you get started, you’ll need to set up a few things:

1. **Download Mistral Model:**
   You need to download one of the following models:

   * [Mistral 7B Instruct](https://github.com/mistral-ai/mistral) (`mistral-7b-instruct-v0.2.Q4_K_M.gguf`)
   * [Mistral 3B](https://github.com/mistral-ai/mistral)

   Save the model in the `models/gguf/` directory.

2. **Download Llama.cpp:**
   You need Llama.cpp to run the Mistral model. Download the latest release from the GitHub page:

   * [Llama.cpp GitHub](https://github.com/ggerganov/llama.cpp)

   For Windows, download the `llama-b5361-bin-win-cuda12.4-x64.zip` binary.

3. **Install Node.js:**
   Install [Node.js](https://nodejs.org/) if you haven't already. Ensure you’re using version 16.x or above.

### Setting Up Your Environment

1. Clone this repository:

   ```bash
   git clone https://github.com/codebyzeun/NEURO.git
   cd NEURO
   ```

2. Install required dependencies:

   ```bash
   npm install
   ```

3. Configure your environment variables by creating a `.env` file in the root directory:

   * Set API keys for any services (Discord, OBS, etc.).
   * Adjust model paths if necessary.

### Required Dependencies

This project requires the following Node.js modules:

* **Core AI Engine**:

  * `node-llama-cpp`
  * `@xenova/transformers`
  * `child_process`

* **Speech Recognition (STT)**:

  * `mic`
  * `whisper.cpp`

* **Text-to-Speech (TTS)**:

  * `edge-tts`
  * `play-sound`

* **Twitch & Discord Interfaces**:

  * `tmi.js`
  * `discord.js`

* **OBS Control**:

  * `obs-websocket-js`

* **Utilities**:

  * `dotenv`
  * `winston`
  * `fs`
  * `path`
  * `readline`

* **Optional Memory/Storage**:

  * `better-sqlite`

* **Dev Tools**:

  * `nodemon`

* **Optional**:

  * `typescript`
  * `@types/node`

### Directory Structure

```
entity-ai-vtube/
├── config/
│   └── config.js               # Constants & hyperparameters
│   └── env.js                  # Environment-based config
│
├── src/
│   ├── llm/
│   │   └── tokenizer.js        # Custom tokenizer or BPE handling
│   │   └── modelRunner.js      # Inference engine (llama.cpp wrapper)
│   │   └── training.js         # Custom training loop
│   │
│   ├── speech/
│   │   └── stt.js              # Speech-to-text (whisper.cpp)
│   │   └── tts.js              # Text-to-speech (Coqui, Piper)
│   │
│   ├── vision/
│   │   └── objectDetection.js  # Optional: image analysis (CLIP, YOLO)
│   │
│   ├── actions/
│   │   └── gameBot.js          # Game event handler or control emulator
│   │   └── streamControl.js    # OBS/Twitch/Youtube commands
│   │
│   ├── interfaces/
│   │   └── twitch.js           # Twitch bot and event listener
│   │   └── discord.js          # Discord bot
│   │   └── obs.js              # OBS WebSocket client
│   │
│   ├── prompts/
│   │   └── basePrompt.txt      # Core behavior prompt
│   │   └── fineTunes/          # Fine-tuning
│   │
│   ├── core/
│   │   └── brain.js            # Main logic: reads input, generates response
│   │   └── memory.js           # Memory system (short-term, long-term)
│   │
│   ├── utils/
│   │   └── logger.js
│   │   └── time.js
│   │
│   ├── index.js                # Entry point
│   └── server.js               # Optional: expose APIs for control
│
├── data/
│   └── chatlogs/
│   └── trainingData/
│
├── models/
│   └── gguf/                   # Local LLM models (ggml/gguf for llama.cpp)
│
├── logs/
│
├── .env
├── .gitignore
├── package.json
└── README.md
```

### Running the Application

1. Start the AI engine:

   ```bash
   npm start
   ```

2. Interact with your AI in Discord or OBS as set up in the config.

### Configuration

You can configure various aspects of the bot through the `config/config.js` and `config/env.js` files. The configuration includes things like model paths, API tokens, OBS settings, and other platform-specific options.

### Optional: Memory & Training

If you want your bot to learn and remember conversations, you can enable optional memory using `better-sqlite` for local storage. Custom training routines can also be set up if you want to fine-tune the model on specific data.

### Troubleshooting

* **Llama.cpp Errors:** Make sure you’ve properly downloaded and configured Llama.cpp binaries.
* **Missing Dependencies:** Run `npm install` to ensure all dependencies are installed correctly.
* **Model Loading Issues:** Ensure the model is placed in the `models/gguf/` folder and is correctly referenced in the `config.js`.

### License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
