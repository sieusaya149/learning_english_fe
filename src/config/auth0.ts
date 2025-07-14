// Environment variables
const AUTH0_DOMAIN = import.meta.env.VITE_AUTH0_DOMAIN;
const AUTH0_CLIENT_ID = import.meta.env.VITE_AUTH0_CLIENT_ID;
const REDIRECT_URI = window.location.origin;

console.log("AUTH0_DOMAIN", AUTH0_DOMAIN)
console.log("AUTH0_CLIENT_ID", AUTH0_CLIENT_ID)
console.log("REDIRECT_URI", REDIRECT_URI)

export const auth0Config = {
    domain: AUTH0_DOMAIN,
    clientId: AUTH0_CLIENT_ID,
    redirectUri: REDIRECT_URI,
    // audience: AUTH0_AUDIENCE, // Optional: for API access
};