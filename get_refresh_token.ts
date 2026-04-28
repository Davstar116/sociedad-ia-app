import { google } from 'googleapis';
import * as readline from 'readline';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

// Replace these with your actual credentials if they are not in .env.local
const CLIENT_ID = process.env.SIAFI_CALENDAR_CLIENT_ID;
const CLIENT_SECRET = process.env.SIAFI_CALENDAR_CLIENT_SECRET;

// You need to add this exact URI to your Google Cloud Console OAuth Client ID allowed redirect URIs
// Or use a Desktop App credential where the redirect isn't as strict (usually http://localhost works)
const REDIRECT_URI = 'http://localhost'; 

const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Error: Please make sure SIAFI_CALENDAR_CLIENT_ID and SIAFI_CALENDAR_CLIENT_SECRET are in your .env.local file.");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline', // VERY IMPORTANT: Required to get a refresh token
  scope: SCOPES,
  prompt: 'consent' // VERY IMPORTANT: Forces Google to show the consent screen again, guaranteeing a refresh token is returned
});

console.log('\n=======================================');
console.log('Autoriza a la aplicación visitando esta URL:');
console.log('=======================================\n');
console.log(authUrl);
console.log('\n=======================================');

rl.question('\nIngresa el código en la URL después de "code=" (si la URL falla y no carga en localhost, simplemente copia el valor "code" de la barra de direcciones): ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(decodeURIComponent(code));
    console.log('\n✅ Autenticación exitosa!');
    console.log('\n====== TU REFRESH TOKEN ======');
    console.log(tokens.refresh_token);
    console.log('==============================\n');
    console.log('Agrega este token a tu archivo .env.local como SIAFI_CALENDAR_REFRESH_TOKEN');
    
    // Add access token just in case
    // oauth2Client.setCredentials(tokens);
  } catch (error) {
    console.error('\n❌ Error al obtener el token:', error);
  } finally {
    rl.close();
  }
});
