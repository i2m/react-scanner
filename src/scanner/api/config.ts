export const HTTPS_API_URL = import.meta.env.DEV
  ? "/api"
  : "https://api-rs.dexcelerate.com";
export const WSS_API_URL = import.meta.env.DEV
  ? "/socket"
  : "wss://api-rs.dexcelerate.com/ws";
