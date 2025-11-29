
import { pipeline } from '@huggingface/transformers';

class AutomaticSpeechRecognitionPipeline {
    static task = 'automatic-speech-recognition';
    static model = 'Xenova/whisper-tiny.en';
    static instance = null;

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
            this.instance = await pipeline(this.task, this.model, {
                quantized: true,
                progress_callback,
            });
        }
        return this.instance;
    }
}

self.addEventListener('message', async (event) => {
    const { type, audio } = event.data;

    if (type === 'transcribe') {
        try {
            const transcriber = await AutomaticSpeechRecognitionPipeline.getInstance((data) => {
                self.postMessage({ type: 'download', data });
            });

            const output = await transcriber(audio, {
                chunk_length_s: 30,
                stride_length_s: 5,
                language: 'english',
                task: 'transcribe',
                return_timestamps: false,
            });

            self.postMessage({
                type: 'complete',
                data: output,
            });
        } catch (error) {
            self.postMessage({
                type: 'error',
                data: error.message,
            });
        }
    }
});
