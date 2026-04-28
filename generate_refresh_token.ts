// generate_refresh_token.ts
import { google } from "googleapis";
import readline from "readline";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const CLIENT_ID = process.env.SIAFI_CALENDAR_CLIENT_ID!;
const CLIENT_SECRET = process.env.SIAFI_CALENDAR_CLIENT_SECRET!;
const REDIRECT_URI = "http://localhost:3000/oauth2callback"; // cualquier URL válida; no tiene que existir

// 1️⃣ Configura el cliente OAuth2
const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

// 2️⃣ Genera la URL de autorización
const SCOPES = [
    "https://www.googleapis.com/auth/calendar", // acceso completo a Calendar
    "https://www.googleapis.com/auth/userinfo.email"
];

const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",          // <-- importante: solicita refresh_token
    scope: SCOPES,
    prompt: "consent",               // fuerza a mostrar el consent screen cada vez
});

console.log("\n=== AUTORIZACIÓN REQUERIDA ===");
console.log("Abre la siguiente URL en tu navegador, inicia sesión con la cuenta que usará la app y otorga permisos:");
console.log(authUrl);
console.log("\nDespués de autorizar, serás redirigido a una URL con un parámetro `code`.\n");

// 3️⃣ Lee el código de autorización desde la consola
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

rl.question("Pega aquí el valor del parámetro `code` y pulsa ENTER: ", async (code) => {
    try {
        // 4️⃣ Intercambia el código por tokens
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        console.log("\n✅ Tokens obtenidos:");
        console.log(`  Access Token : ${tokens.access_token}`);
        console.log(`  Refresh Token: ${tokens.refresh_token}`);
        console.log("\n⚠️ Copia el valor de `refresh_token` y pégalo en tu .env.local:\n");
        console.log(`SIAFI_CALENDAR_REFRESH_TOKEN=${tokens.refresh_token}`);

        console.log("\nUna vez guardado, reinicia tu servidor (npm run dev) y vuelve a probar la agenda.");
    } catch (err) {
        console.error("\n❌ Error al intercambiar el código:", err);
    } finally {
        rl.close();
    }
});
