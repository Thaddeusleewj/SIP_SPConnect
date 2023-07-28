import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

var realtime = supabase
  .channel("any")
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "user_task" },
    async (payload) => {
      console.log("Change received!", payload);
      await populateData();
      console.log(score);
      axios
        .post(`/api/task/${payload["new"]["taskID"]}`, {
          id: payload["new"]["userID"],
        })
        .then(async ({ data }) => {
          console.log(data);
          await updateTree();
          // document.getElementById("treeBoard").innerHTML =
          //   `
          //   <div class="pos flex gap-4 items-center py-4 px-2">
          //     <div class="flex flex-col grow">
          //       <p class="font-medium text-sm">${data[0]["user"][0]["name"]}</p>
          //       <p class="text-xs">${data[0]["name"]}</p>
          //     </div>
          //     <p class="font-bold flex gap-2">
          //       + ${data[0]["points"]}
          //     </p>
          //   </div>
          //   ` + document.getElementById("treeBoard").innerHTML;
        })
        .catch((err) => {
          if (err) {
            console.log(err);
          }
        });
    }
  )
  .subscribe();
