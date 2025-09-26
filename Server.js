require("dotenv").config();
const express = require("express");
const cors = require("cors");
const twilio = require("twilio");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

// In-memory call state for demo
let callState = { isCalling: false, isMuted: false, callSid: null };

// Start Call
app.post("/api/call/start", async (req, res) => {
  const { to } = req.body;
  if (!to) return res.status(400).json({ error: "Number required" });

  try {
    const call = await client.calls.create({
      url: "http://demo.twilio.com/docs/voice.xml", // TwiML URL
      to: to,
      from: fromNumber,
    });

    callState.isCalling = true;
    callState.isMuted = false;
    callState.callSid = call.sid;

    console.log("Call started to", to, "SID:", call.sid);
    res.json({ message: `Call started to ${to}`, sid: call.sid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to start call" });
  }
});

// End Call
app.post("/api/call/end", async (req, res) => {
  const sid = callState.callSid;
  if (!sid) return res.status(400).json({ error: "No active call" });

  try {
    await client.calls(sid).update({ status: "completed" });
    callState = { isCalling: false, isMuted: false, callSid: null };
    res.json({ message: "Call ended" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to end call" });
  }
});

// Mute / Unmute (Twilio does not directly support mute via REST API, can be handled via WebRTC)
app.post("/api/call/mute", (req, res) => {
  const { mute } = req.body;
  if (!callState.isCalling) return res.status(400).json({ error: "No active call" });

  callState.isMuted = !!mute;
  console.log(`Call is now ${callState.isMuted ? "Muted" : "Unmuted"}`);
  res.json({ message: `Call ${callState.isMuted ? "muted" : "unmuted"}` });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
