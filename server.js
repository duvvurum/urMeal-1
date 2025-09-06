const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const ollamaModel = 'qwen:4b';

app.post('/generate-meal-plan', async (req, res) => {
    const { prompt } = req.body;
    try {
        const response = await fetch(
            'http://localhost:11434/api/generate',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: ollamaModel,
                    prompt: prompt
                }),
                timeout: 120000 // 2 minutes
            }
        );
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch meal plan.' });
    }
});

app.listen(3000, () => {
    console.log('Backend server running on http://localhost:3000');
});