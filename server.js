const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const supabase = require("./config/supabase");
const PORT = 8081;
require("dotenv").config();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Homepage
app.get("/", (req, res) => {
  res.render("index");
});

// Whatsapp layout
app.get("/chat", (req, res) => {
  res.render("chat");
});

// Internal Chat
app.get("/room/:ROOM_ID", (req, res) => {
  res.render("room", { roomId: req.params.ROOM_ID });
});

// Login
app.get("/start", (req, res) => {
  res.render("start");
});

// Login POST
app.post("/api/start", async (req, res) => {
  let name = req.body.name;
  var phoneNo = "";
  for (let i = 0; i <= 8; i++) {
    do {
      var num = Math.floor(Math.random() * 10);
    } while (i == 0 && num == 0);
    phoneNo += num;
  }
  phoneNo = parseInt(phoneNo);
  // create account
  var { data, error } = await supabase
    .from("user")
    .insert([{ id: phoneNo, name: name }])
    .select();
  var userData = data;
  if (error) {
    console.log(error);
    return res.status(500).send(error);
  }
  // default chats
  var { data, error } = await supabase
    .from("user_chat")
    .insert([{ userID: phoneNo, chatID: 1 }])
    .select();
  console.log(userData);
  return res.status(201).send(userData);
});

// Get all chats API
app.post("/api/chat", async (req, res) => {
  let userid = req.body.id;
  console.log(userid);
  var { data, error } = await supabase
    .from("chat")
    .select("*, user_chat(*), message(*), user(*)")
    .eq("user_chat.userID", userid)
    .order("created_at", { foreignTable: "message", ascending: false });
  if (error) {
    console.log(error);
    return res.status(500).send(error);
  }
  console.log(data);
  return res.status(200).send(data);
});

async function uploadMessage(roomId, phoneNo, message) {
  const { data, error } = await supabase
    .from("message")
    .insert([
      {
        userID: parseInt(phoneNo),
        chatID: roomId.split("_")[0],
        content: message,
      },
    ])
    .select();
  if (error) {
    console.log(error);
    return error;
  }
}

// Get chat history
app.post("/api/chat/:roomID", async (req, res) => {
  let roomId = req.params.roomID;
  let user_id = req.body.id;
  var { data, error } = await supabase
    .from("chat")
    .select("*, user_chat(*), message(*), user(*)")
    .eq("id", roomId)
    .order("created_at", { foreignTable: "message", ascending: true });
  if (error) {
    console.log(error);
    return res.status(500).send(error);
  }
  console.log(data);
  return res.status(200).send(data);
});

io.on("connection", (socket) => {
  console.log("New user connected");
  socket.emit("clientid", socket.id);
  socket.on("join-room", (roomId, userID) => {
    socket.join(roomId);
    socket.to(roomId).broadcast.emit("user-connected", userID);
    socket.on("disconnect", () => {
      socket.to(roomId).broadcast.emit("user-disconnected", userID);
    });
  });
  socket.on("message", (payload) => {
    const { roomId, message, userID, phoneNo } = payload;
    uploadMessage(roomId, phoneNo, message);
    io.to(roomId).emit("message", { user: userID, message });
  });
});

server.listen(process.env.PORT || PORT);
console.log(
  `Web server is listening at http://localhost:${process.env.PORT || PORT}/`
);
