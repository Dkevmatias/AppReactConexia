import axios, { AxiosInstance } from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true // Necesario para enviar cookie HttpOnly
});