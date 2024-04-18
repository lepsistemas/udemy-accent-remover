const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const textToSpeech = require('@google-cloud/text-to-speech');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const client = new textToSpeech.TextToSpeechClient();

app.post('/execute', async (req, res) => {
    const { text } = req.body;
    const request = {
        input: { text: text },
        voice: { languageCode: 'en-US', name: 'en-US-Studio-Q', ssmlGender: 'MALE' },
        audioConfig: {
            audioEncoding: 'MP3',
            pitch: -1.0,
            speakingRate: 1.25
        }
    };

    try {
        const [response] = await client.synthesizeSpeech(request);
        res.set('Content-Type', 'audio/mpeg');
        res.send(response.audioContent);
    } catch (error) {
        console.error('Failed to synthesize speech:', error);
        res.status(500).send('Error synthesizing speech');
    }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

exports['synthesize-speech'] = app;
