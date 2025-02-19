import { appVersionGet } from "@/client";
import { queryOptions, useQuery } from "@tanstack/react-query";
import gte from "semver/functions/gte";

export const appVersionOptions = queryOptions({
  queryKey: ["version"],
  queryFn: async () => {
    const res = await appVersionGet();
    return res.data;
  },
});

export const useAppVersion = () => {
  const version = useQuery(appVersionOptions);

  return {
    version,
    isV5orHigher: version.data ? gte(version.data, "5.0.0") : undefined,
  };
};
