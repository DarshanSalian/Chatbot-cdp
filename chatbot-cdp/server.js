const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const dotenv = require('dotenv');
const { NLP } = require('natural'); // Optional: Advanced NLP processing

dotenv.config();

const app = express();
const port = 3000;

// Middleware to parse incoming requests
app.use(express.json());
app.use(express.static('public')); // Serve static files for frontend

// Serve index.html for root path
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Function to fetch documentation data from a CDP
const fetchDocumentation = async (platform) => {
    const urls = {
        segment: 'https://segment.com/docs/?ref=nav',
        mparticle: 'https://docs.mparticle.com/',
        lytics: 'https://docs.lytics.com/',
        zeotap: 'https://docs.zeotap.com/home/en-us/',
    };
    
    try {
        console.log(`Fetching documentation for ${platform}...`);
        const response = await axios.get(urls[platform.toLowerCase()]);
        console.log(`Successfully fetched documentation for ${platform}.`);
        return response.data;  // Return the HTML content of the documentation page
    } catch (error) {
        console.error('Error fetching documentation:', error);
        return null;
    }
};

// Function to extract relevant information from HTML content
const extractInformation = (html, question) => {
    const $ = cheerio.load(html);
    const relevantSections = $('h1, h2, h3, p').filter((i, el) => {
        const text = $(el).text().toLowerCase();
        return text.includes(question.toLowerCase());
    }).map((i, el) => $(el).text()).get();

    return relevantSections.length > 0 ? relevantSections.join('\n') : null;
};

// Enhanced response function for "how-to" questions
const getHowToAnswer = async (question) => {
    let platform = '';
    if (question.includes('Segment')) {
        platform = 'segment';
    } else if (question.includes('mParticle')) {
        platform = 'mparticle';
    } else if (question.includes('Lytics')) {
        platform = 'lytics';
    } else if (question.includes('Zeotap')) {
        platform = 'zeotap';
    }

    if (!platform) {
        return 'Sorry, I can only answer questions related to Segment, mParticle, Lytics, and Zeotap.';
    }

    const docData = await fetchDocumentation(platform);
    if (docData) {
        const relevantInfo = extractInformation(docData, question);
        if (relevantInfo) {
            return `Here is the information from ${platform} documentation:\n${relevantInfo}`;
        }
    }
    return 'Sorry, I could not find an answer for that question.';
};

// Define the chatbot API
app.post('/chat', async (req, res) => {
    const userQuestion = req.body.question;
    const answer = await getHowToAnswer(userQuestion);
    res.json({ answer });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
