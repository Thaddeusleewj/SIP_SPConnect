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

const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

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
  var phoneNo = req.body.phoneNo;

  if (!phoneNo) {
    phoneNo = "";
    for (let i = 0; i < 8; i++) {
      do {
        var num = Math.floor(Math.random() * 10);
      } while (i == 0 && num == 0);
      phoneNo += num;
    }
    phoneNo = parseInt(phoneNo);
  }

  // check if exist
  var { data, error } = await supabase
    .from("user")
    .select("*")
    .eq("id", phoneNo)
    .eq("name", name);
  console.log(`Check Exist: ${data}234`);
  if (error) {
    console.log(error);
    return res.status(500).send(error);
  }
  if (data.length > 0) {
    console.log(data);
    return res.status(200).send(data);
  }

  // create account
  var { data, error } = await supabase
    .from("user")
    .insert([{ id: phoneNo, name: name }])
    .select();
  var userData = JSON.parse(JSON.stringify(data));
  if (error) {
    console.log(error);
    return res.status(500).send(error);
  }

  // default chats
  var { data, error } = await supabase
    .from("user_chat")
    .insert([
      { userID: phoneNo, chatID: 1 },
      // { userID: phoneNo, chatID: 2 },
    ])
    .select();
  if (error) {
    console.log(error);
    return res.status(500).send(error);
  }
  console.log(userData);
  return res.status(201).send(userData);
});

// Get all chats API
app.post("/api/getChat", async (req, res) => {
  let userid = req.body.id;
  console.log(userid);
  var { data, error } = await supabase
    .from("chat")
    .select("*, user_chat(*), message(*), user(*)")
    .eq("user_chat.userID", userid)
    .order("created_at", { ascending: false })
    .order("joined_date", { foreignTable: "user_chat", ascending: false })
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
  return data[0];
}

// Get chat history
app.post("/api/chat/:roomID", async (req, res) => {
  let roomId = req.params.roomID;
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

// Create chat
app.post("/api/chat", async (req, res) => {
  let userID = req.body.id;
  let chatName = req.body.chatName;
  var { data, error } = await supabase
    .from("chat")
    .select()
    .eq("name", chatName);

  if (error) {
    console.log(error);
    return res.status(500).send(error);
  }
  // Chat Exist
  if (data.length == 0) {
    var { data, error } = await supabase
      .from("chat")
      .insert([{ name: chatName }])
      .select();
    if (error) {
      console.log(error);
      return res.status(500).send(error);
    }
  }

  // Join user into chat
  var { data, error } = await supabase
    .from("user_chat")
    .insert([{ chatID: data[0]["id"], userID: userID }])
    .select();

  if (error) {
    console.log(error);
    return res.status(500).send(error);
  }
  console.log(data);
  return res.status(200).send();
});

// Translate API [message from Singlish to English]
app.post("/api/translate", async (req, res) => {
  let message = req.body.message;
  let from = "singlish";
  let to = "english";
  let translate = req.body.to;
  if (translate) {
    from = "english";
    to = "singlish";
  }
  try {
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `translate "${message}" from ${from} to ${to} just give the translation no explanation and only give one response`,
      temperature: 1,
      max_tokens: 100,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });
    return res.status(200).send(response.data.choices[0].text.trim());
  } catch (error) {
    return res.status(200).send(message);
  }
});

// Translate
app.get("/translate", (req, res) => {
  res.render("translate");
});

// Get message
app.get("/api/message/:id", async (req, res) => {
  let messageID = req.params.id;
  var { data, error } = await supabase
    .from("message")
    .select()
    .eq("id", messageID);
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
  socket.on("message", async (payload) => {
    const { roomId, message, userID, phoneNo } = payload;
    let output = await uploadMessage(roomId, phoneNo, message);
    if ("id" in output) {
      io.to(roomId).emit("message", {
        user: userID,
        message,
        id: output["id"],
      });
    }
  });
});

server.listen(process.env.PORT || PORT);
console.log(
  `Web server is listening at http://localhost:${process.env.PORT || PORT}/`
);
