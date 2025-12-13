// src/utils/jwt.ts
import * as decodeModule from "jwt-decode";

// Convertimos el import en una función callable
const jwt_decode = decodeModule as unknown as <T = any>(token: string) => T;

export default jwt_decode;
