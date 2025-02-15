import axios from "axios";

export const port = 3001;

export const DEEP_RESEARCH_URL = 'http://deep_research:4000'

export const axiosInstance = axios.create({
    baseURL: DEEP_RESEARCH_URL,
    timeout: 5000, // таймаут 5 секунд
    headers: {
      'Content-Type': 'application/json'
    }
  });
