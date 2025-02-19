import { syncMaindataPost } from "@/client";
import { type SyncMaindataPostResponse } from "@/client/types.gen";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

export const useMainData = () => {
  const mainData = useQuery({
    queryKey: ["mainData"],
    queryFn: async (): Promise<
      Pick<
        SyncMaindataPostResponse,
        "full_update" | "rid" | "server_state" | "categories" | "tags"
      >
    > => {
      const oldData = mainData.data ?? {};
      // the previous request id to compare to
      const rid = oldData?.rid;

      const result = await syncMaindataPost({
        body: {
          rid,
        },
      });

      if (result.data?.full_update) return result.data;

      // omit torrents
      const newData = {
        ...oldData,
        ...(result.data ?? {}),
        server_state: {
          ...oldData.server_state,
          ...(result.data?.server_state ?? {}),
        },
      };

      return newData;
    },
  });

  const serverState = z
    .object({
      alltime_dl: z.number().catch(0),
      alltime_ul: z.number().catch(0),
      global_ratio: z.coerce.number().catch(0),
      free_space_on_disk: z.number().catch(0),
    })
    .parse(mainData.data?.server_state ?? {});

  return {
    mainData,
    serverState,
  };
};
