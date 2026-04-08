import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function testMeetLink() {
  try {
    console.log("Testing Google Calendar Meet generation...");
    const client_id = process.env.SIAFI_CALENDAR_CLIENT_ID;
    const client_secret = process.env.SIAFI_CALENDAR_CLIENT_SECRET;
    const refresh_token = process.env.SIAFI_CALENDAR_REFRESH_TOKEN;

    if (!client_id || !refresh_token) {
      console.log("Missing calendar credentials in env");
      return;
    }

    const oauth2Client = new google.auth.OAuth2(client_id, client_secret);
    oauth2Client.setCredentials({ refresh_token });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Dummy future dates for today
    const startDateTime = new Date();
    startDateTime.setHours(startDateTime.getHours() + 1);
    const endDateTime = new Date();
    endDateTime.setHours(endDateTime.getHours() + 2);

    const requestId = `test-meet-req-${Date.now()}`;

    const eventResponse = await calendar.events.insert({
      calendarId: "primary",
      conferenceDataVersion: 1,
      sendUpdates: "all",
      requestBody: {
        summary: "Test Event para Meet",
        description: "Test description",
        start: { dateTime: startDateTime.toISOString(), timeZone: "America/Mexico_City" },
        end: { dateTime: endDateTime.toISOString(), timeZone: "America/Mexico_City" },
        attendees: [
          { email: "david.solorzano.a@gmail.com", responseStatus: "accepted" }
        ],
        guestsCanModify: true,
        guestsCanInviteOthers: true,
        conferenceData: {
          createRequest: {
            requestId: requestId,
            conferenceSolutionKey: { type: "hangoutsMeet" }
          }
        }
      }
    });

    console.log("Full Event Data:", JSON.stringify(eventResponse.data, null, 2));

    const meetLink = eventResponse.data.hangoutLink;
    console.log("=> Hangout link directly:", meetLink);

    const conferencePoints = eventResponse.data.conferenceData?.entryPoints;
    console.log("=> Conference entry points:", conferencePoints);

  } catch (error: any) {
    console.error("Error connecting to calendar:", error?.response?.data || error);
  }
}

testMeetLink();
