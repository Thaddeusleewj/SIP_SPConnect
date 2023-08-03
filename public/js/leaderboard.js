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
          await populateData();
        })
        .catch((err) => {
          if (err) {
            console.log(err);
          }
        });
    }
  )
  .subscribe();
