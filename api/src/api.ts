import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { DEEP_RESEARCH_URL } from './config';

const app = express();

app.use(cors());
app.use(express.json());


app.post('/api/request', async (req, res) => {
    try {

        const data = {
            message: req.body.message
        }

        const response = await axios.post(`${DEEP_RESEARCH_URL}/request`, data);
        return res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

