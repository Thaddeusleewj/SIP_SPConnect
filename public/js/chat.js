for (let chatName of ["SIP", "Jen", "Thad"]) {
  document.getElementById(
    "chatDiv"
  ).innerHTML += `<a href="/room/${chatName}" class="chat py-3 mx-3">
  <div class="w-full flex items-center gap-5">
    <img
      src="https://img.freepik.com/free-icon/user_318-563642.jpg?w=360"
      class="aspect-square w-14"
    />
    <div class="flex flex-col w-full">
      <div class="w-full flex justify-between items-center">
        <p class="chatName font-bold">${chatName}</p>
        <p class="text-gray-500 text-xs chatTime">
          ${String(new Date().getHours()).padStart(2, "0")}:${String(
    new Date().getMinutes()
  ).padStart(2, "0")}
        </p>
      </div>
      <p class="previousText text-xs text-gray-500">test</p>
    </div>
  </div>
</a>`;
}
