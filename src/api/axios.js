// axios.js

import axios from "axios";

const API = axios.create({
  // baseURL: "http://localhost:9500",
  baseURL: "https://api.digitaleliteservices.in",
  // baseURL: "https://server.digitaleliteservices.in",
});

export default API;
