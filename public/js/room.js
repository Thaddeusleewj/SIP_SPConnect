const socket = io("/");
let socketclientid;
const myPeer = new Peer();

document.getElementById("sendChat").addEventListener("click", () => {
  let message = document.getElementById("chatMessage").value;
  if (message == "") return;
  socket.emit("message", {
    message: message,
    roomId: ROOM_ID,
    userid: localStorage.getItem("name"),
  });
  document.getElementById("chatMessage").value = "";
});

let chatHistory = document.getElementById("chatHistory");

socket.on("clientid", (id) => {
  socketclientid = localStorage.getItem("name");
  console.log(socketclientid);
});

socket.on("message", (payload) => {
  const { message, user } = payload;
  console.log(message);
  chatHistory.innerHTML += `<div class="chat ${
    user.toString() == socketclientid.toString() ? "chat-end" : "chat-start"
  }">
          <div class="chat-header">
            ${user}
            <time class="text-xs opacity-50">${String(
              new Date().getHours()
            ).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(
    2,
    "0"
  )}</time>
          </div>
          <div class="chat-bubble chat-bubble-primary">
            ${message}
          </div>
        </div>`;
  if (user.toString() == socketclientid.toString()) {
    chatHistory.scrollTo(0, chatHistory.scrollHeight);
  }
});
socket.on("user-connected", (userId) => {
  console.log("connected" + userId);
});

socket.on("user-disconnected", (userId) => {
  console.log("disconnected");
});

myPeer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
});
