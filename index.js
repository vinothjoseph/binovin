require('dotenv').config(); // Load environment variables from .env
const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 5000;

// Zerodha API credentials (loaded from .env)
const KITE_API_KEY = process.env.KITE_API_KEY;
const KITE_SECRET = process.env.KITE_SECRET;
const REDIRECT_URL = process.env.REDIRECT_URL;

// Step 1: Redirect user to Zerodha's authorization page
app.get('/login', (req, res) => {
    const authUrl = `https://kite.zerodha.com/connect/login?api_key=${KITE_API_KEY}&v=3`;
    res.redirect(authUrl);
});

// Step 2: Handle the callback from Zerodha
app.get('/callback', async (req, res) => {
    const { request_token } = req.query;

    if (!request_token) {
        return res.status(400).send('Missing request_token');
    }

    try {
        // Step 3: Exchange request_token for access_token
        const response = await axios.post(
            'https://api.kite.trade/session/token',
            null, // No request body
            {
                params: {
                    api_key: KITE_API_KEY,
                    request_token: request_token,
                    checksum: generateChecksum(KITE_API_KEY, request_token, KITE_SECRET),
                },
            }
        );

        const { access_token } = response.data;
        res.send(`Access Token: ${access_token}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error exchanging request_token for access_token');
    }
});

// Helper function to generate checksum
function generateChecksum(apiKey, requestToken, apiSecret) {
    const data = apiKey + requestToken + apiSecret;
    return require('crypto').createHash('sha256').update(data).digest('hex');
}

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
