import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs'; // Node.js File System module for saving files
import { pipeline } from 'stream'; // For handling Node.js streams
import { promisify } from 'util'; // To use promisify to handle callbacks

const streamPipeline = promisify(pipeline);

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/synthesize-speech', async (req, res) => {
    const { text, voice_settings } = req.body;
    const url = 'https://api.elevenlabs.io/v1/text-to-speech/5PL3mXw0y7D01sjTZoPz';

    const options = {
        method: 'POST',
        headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': process.env.XI_API_KEY
        },
        body: JSON.stringify({
            text: text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: voice_settings
        })
    };

    try {
        const response = await fetch(url, options);
        if (response.ok) {
            // You might want to save the audio or send it directly to the client
            // Example: Save the audio file
            const audioFilePath = `audio-${Date.now()}.mp3`;
            await streamPipeline(response.body, fs.createWriteStream(audioFilePath));
            res.status(200).json({ message: 'Audio saved successfully!', path: audioFilePath });
        } else {
            // If response is not okay, send an error
            throw new Error(`API responded with status ${response.status}`);
        }
    } catch (error) {
        console.error('Error handling the audio data:', error);
        res.status(500).json({ error: 'Failed to process audio data', details: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
