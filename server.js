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

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/chat", (req, res) => {
  res.render("chat");
});

app.get("/room/:ROOM_ID", (req, res) => {
  res.render("room", { roomId: req.params.ROOM_ID });
});

app.get("/start", (req, res) => {
  res.render("start");
});

app.post("/start", async (req, res) => {
  let name = req.body.name;
  var phoneNo = "";
  for (let i = 0; i <= 8; i++) {
    do {
      var num = Math.floor(Math.random() * 10);
    } while (i == 0 && num == 0);
    phoneNo += num;
  }
  phoneNo = parseInt(phoneNo);
  var { data, error } = await supabase
    .from("user")
    .insert([{ id: phoneNo, name: name }])
    .select();
  if (error) {
    console.log(error);
    return res.status(500).send(error);
  }
  console.log(data);
  return res.status(201).send(data);
});

io.on("connection", (socket) => {
  console.log("New user connected");
  socket.emit("clientid", socket.id);
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).broadcast.emit("user-connected", userId);
    socket.on("disconnect", () => {
      socket.to(roomId).broadcast.emit("user-disconnected", userId);
    });
  });
  socket.on("message", (payload) => {
    const { roomId, message, userid } = payload;
    io.to(roomId).emit("message", { user: userid, message });
  });
});

server.listen(process.env.PORT || PORT);
console.log(
  `Web server is listening at http://localhost:${process.env.PORT || PORT}/`
);
