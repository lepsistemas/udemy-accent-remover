import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/synthesize-speech', async (req, res) => {
    const { text } = req.body;
    const url = 'https://api.elevenlabs.io/v1/text-to-speech/5PL3mXw0y7D01sjTZoPz';

    const options = {
        method: 'POST',
        headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': process.env.API_KEY
        },
        body: JSON.stringify({
            text: text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.5
            }
        })
    };

    try {
        const response = await fetch(url, options);
        if (response.ok) {
            res.setHeader('Content-Type', 'audio/mpeg');
            response.body.pipe(res);
        } else {
            throw new Error(`API responded with status ${response.status}`);
        }
    } catch (error) {
        console.error('Error fetching from ElevenLabs API:', error);
        res.status(500).json({ error: 'Failed to fetch from ElevenLabs API', details: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
