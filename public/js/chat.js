axios
  .post("/api/getChat", { id: localStorage.getItem("userid") })
  .then(async ({ data }) => {
    console.log(data);

    // SORT DATA [SUPABASE FOREIGN TABLE CANNOT DO GOOD SORTING]
    data.sort((a, b) => {
      let aDate;
      let bDate;
      if (a["message"].length) {
        aDate = a["message"][0]["created_at"];
      } else {
        if (a["user_chat"].length) {
          aDate = a["user_chat"][0]["joined_date"];
        } else {
          aDate = a["created_at"];
        }
      }
      if (b["message"].length) {
        bDate = b["message"][0]["created_at"];
      } else {
        if (b["user_chat"].length) {
          bDate = b["user_chat"][0]["joined_date"];
        } else {
          bDate = b["created_at"];
        }
      }
      aDate = new Date(aDate);
      bDate = new Date(bDate);
      return bDate - aDate;
    });

    // Loop through data
    for await (let { id, name, created_at, user_chat, message, user } of data) {
      if (user_chat.length == 0) {
        continue;
      }
      if (message[0]) {
        var lastSender = user.filter((ele) => {
          return ele["id"] == message[0]["userID"];
        })[0];
      }
      let anchorTag = document.createElement("a");
      anchorTag.href = `/room/${id}_${name}`;
      anchorTag.classList.add("chat", "py-3", "mx-3");
      let chatContainer = document.createElement("div");
      chatContainer.classList.add("w-full", "flex", "items-center", "gap-5");
      let pfp = document.createElement("img");
      pfp.src = "https://img.freepik.com/free-icon/user_318-563642.jpg?w=360";
      pfp.classList.add("aspect-square", "w-14");
      let chatInfo = document.createElement("div");
      chatInfo.classList.add("flex", "flex-col", "w-full");
      let chatNameContainer = document.createElement("div");
      chatNameContainer.classList.add(
        "w-full",
        "flex",
        "justify-between",
        "items-center"
      );
      let chatNameTag = document.createElement("p");
      chatNameTag.classList.add("font-bold");
      chatNameTag.innerText = name;
      let chatTime = document.createElement("p");
      chatTime.classList.add("text-gray-500", "text-xs");
      if (message[0]) {
        chatTime.innerText = `${String(
          new Date(message[0]["created_at"]).getHours()
        ).padStart(2, "0")}:${String(
          new Date(message[0]["created_at"]).getMinutes()
        ).padStart(2, "0")}`;
      } else {
        chatTime.innerText = `${String(
          new Date(created_at).getHours()
        ).padStart(2, "0")}:${String(
          new Date(created_at).getMinutes()
        ).padStart(2, "0")}`;
      }
      let previousText = document.createElement("p");
      previousText.classList.add("text-xs", "text-gray-500");
      if (message[0]) {
        previousText.innerText = `${lastSender["name"]}: ${message[0]["content"]}`;
      } else {
        previousText.innerText = `${name} was created`;
      }
      chatNameContainer.appendChild(chatNameTag);
      chatNameContainer.appendChild(chatTime);
      chatInfo.appendChild(chatNameContainer);
      chatInfo.appendChild(previousText);
      chatContainer.appendChild(pfp);
      chatContainer.appendChild(chatInfo);
      anchorTag.appendChild(chatContainer);
      document.getElementById("chatDiv").appendChild(anchorTag);
    }
  })
  .catch((err) => {
    if (err) {
      console.log(err);
    }
  });

document.getElementById("createChat").addEventListener("submit", (e) => {
  e.preventDefault();
  axios
    .post("/api/chat", {
      id: localStorage.getItem("userid"),
      chatName: document.getElementById("chatName").value,
    })
    .then(({ data }) => {
      console.log(data);
      window.location.reload();
    })
    .catch((err) => {
      if (err) {
        console.log(err);
        alert("You are already in group!");
      }
    });
});
