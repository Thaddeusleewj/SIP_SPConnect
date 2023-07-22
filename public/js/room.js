const socket = io("/");
let socketclientid;
const myPeer = new Peer();

var userArr = [];
function sendMessage() {
  let message = document.getElementById("chatMessage").value;
  if (message == "") return;
  socket.emit("message", {
    message: message.trim(),
    roomId: ROOM_ID,
    userID: localStorage.getItem("name"),
    phoneNo: localStorage.getItem("userid"),
  });
  document.getElementById("chatMessage").value = "";
  setTimeout(() => {
    document.getElementById("chatMessage").value = "";
  }, 1);
}

document.getElementById("sendChat").addEventListener("click", () => {
  sendMessage();
});

document.getElementById("chatMessage").addEventListener("keypress", (e) => {
  if (e.key == "Enter" && !e.shiftKey) {
    sendMessage();
  }
});

let chatHistory = document.getElementById("chatHistory");

socket.on("clientid", (id) => {
  socketclientid = localStorage.getItem("name");
  console.log(socketclientid);
});

function chatMessage(message, user, currentUser, timeSent) {
  let chatContainer = document.createElement("div");
  chatContainer.classList.add("chat");
  chatContainer.classList.add(user == currentUser ? "chat-end" : "chat-start");
  let chatHeader = document.createElement("div");
  chatHeader.classList.add("chat-header");
  let userContainer = document.createElement("p");
  userContainer.innerText = user;
  chatHeader.appendChild(userContainer);
  let chatTime = document.createElement("time");
  chatTime.classList.add("text-xs", "opacity-50");
  chatTime.innerText = `${String(timeSent.getHours()).padStart(
    2,
    "0"
  )}:${String(timeSent.getMinutes()).padStart(2, "0")}`;
  chatHeader.appendChild(chatTime);
  let chatBubble = document.createElement("div");
  chatBubble.classList.add("chat-bubble", "chat-bubble-primary", "break-words");
  chatBubble.innerText = message;
  chatContainer.appendChild(chatHeader);
  chatContainer.appendChild(chatBubble);
  chatHistory.append(chatContainer);
}

socket.on("message", (payload) => {
  const { message, user } = payload;
  console.log(user);
  chatMessage(message, user, socketclientid.toString(), new Date());
  if (user.toString() == socketclientid.toString()) {
    chatHistory.scrollTo(0, chatHistory.scrollHeight);
  }
});
socket.on("user-connected", (userID) => {
  console.log(`${userID} has joined`);
  userArr.push(userID);
  console.log(userArr);
});

socket.on("user-disconnected", (userID) => {
  console.log(`${userID} has left`);
  userArr = userArr.filter((value) => value != userID);
  console.log(userArr);
});

myPeer.on("open", (id) => {
  id = localStorage.getItem("name");
  socket.emit("join-room", ROOM_ID, id);
});

axios
  .post(`/api/chat/${ROOM_ID.split("_")[0]}`, {
    id: localStorage.getItem("userid"),
  })
  .then(async ({ data }) => {
    console.log(data[0]);
    var userGroup = data[0]["user"].map((e) => {
      return e["name"];
    });
    members.innerText = userGroup.join(", ");
    for await (let message of data[0]["message"]) {
      let userObj = data[0]["user"].filter(
        (e) => e["id"] == message["userID"]
      )[0];
      chatMessage(
        message["content"],
        userObj["name"],
        localStorage.getItem("name"),
        new Date(message["created_at"])
      );
    }
  })
  .catch((err) => {
    if (err) {
      console.log(err);
    }
  });
