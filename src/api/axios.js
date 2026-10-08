// axios.js

import axios from "axios";

const API = axios.create({
  //baseURL: "http://localhost:9500",
  baseURL: "https://api.digitaleliteservices.in",
});

// Automatically attach auth token if available
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default API;

