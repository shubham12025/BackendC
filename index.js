require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Store active calls per channel
let calls = {}; // { channelName: { users: [uid1, uid2, ...] } }

// Generate Agora token
function generateToken(channelName, uid) {
  const appID = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;
  const role = RtcRole.PUBLISHER;
  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpireTs = currentTimestamp + expirationTimeInSeconds;

  return RtcTokenBuilder.buildTokenWithUid(
    appID,
    appCertificate,
    channelName,
    uid,
    role,
    privilegeExpireTs
  );
}

// Start Call
app.post("/api/call/start", (req, res) => {
  const { number } = req.body; // optional, for UI label
  const channelName = "call_" + Date.now();
  const uid = Math.floor(Math.random() * 100000); // unique UID

  const token = generateToken(channelName, uid);

  // Initialize call
  calls[channelName] = { users: [uid] };

  console.log(`Call started with ${number || "unknown"} on channel ${channelName}`);

  res.json({ channelName, uid, token });
});

// Join existing call
app.post("/api/call/join", (req, res) => {
  const { channelName } = req.body;
  if (!channelName || !calls[channelName])
    return res.status(400).json({ error: "Channel does not exist" });

  const uid = Math.floor(Math.random() * 100000);
  const token = generateToken(channelName, uid);

  calls[channelName].users.push(uid);

  res.json({ channelName, uid, token });
});

// End Call
app.post("/api/call/end", (req, res) => {
  const { channelName } = req.body;
  if (!channelName || !calls[channelName])
    return res.status(400).json({ error: "No active call" });

  delete calls[channelName];
  console.log(`Call ended on channel ${channelName}`);
  res.json({ message: "Call ended" });
});

app.listen(PORT, () => {
  console.log(`Agora Call Backend running on http://localhost:${PORT}`);
});
