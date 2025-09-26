require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

let callState = { isCalling: false, isMuted: false, channelName: null };

// Generate Agora Token
function generateToken(channelName) {
  const appID = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;
  const uid = 0; // 0 means generate a random UID on client side
  const role = RtcRole.PUBLISHER;
  const expirationTimeInSeconds = 3600; // 1 hour
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpireTs = currentTimestamp + expirationTimeInSeconds;

  const token = RtcTokenBuilder.buildTokenWithUid(
    appID,
    appCertificate,
    channelName,
    uid,
    role,
    privilegeExpireTs
  );
  return token;
}

// Start Call
app.post("/api/call/start", (req, res) => {
  const { to } = req.body; // frontend number/contact
  if (!to) return res.status(400).json({ error: "Number required" });

  const channelName = "call_" + Date.now(); // unique channel per call
  const token = generateToken(channelName);

  callState = { isCalling: true, isMuted: false, channelName };

  console.log(`Call started with ${to} on channel ${channelName}`);
  res.json({ message: "Call started", channelName, token });
});

// End Call
app.post("/api/call/end", (req, res) => {
  if (!callState.isCalling)
    return res.status(400).json({ error: "No active call" });

  console.log(`Call ended on channel ${callState.channelName}`);
  callState = { isCalling: false, isMuted: false, channelName: null };
  res.json({ message: "Call ended" });
});

// Mute / Unmute
app.post("/api/call/mute", (req, res) => {
  const { mute } = req.body;
  if (!callState.isCalling)
    return res.status(400).json({ error: "No active call" });

  callState.isMuted = !!mute;
  console.log(`Call is now ${callState.isMuted ? "Muted" : "Unmuted"}`);
  res.json({ message: `Call ${callState.isMuted ? "muted" : "unmuted"}` });
});

app.listen(PORT, () => {
  console.log(`Agora Call Backend running on http://localhost:${PORT}`);
});
