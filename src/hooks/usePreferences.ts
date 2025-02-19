import { appPreferencesGet } from "@/client";
import { queryOptions, useQuery } from "@tanstack/react-query";

export const preferencesOptions = queryOptions({
  queryKey: ["preferences"],
  queryFn: async () => {
    const res = await appPreferencesGet();
    return res.data;
  },
});

export const usePreferences = () => {
  const prefs = useQuery(preferencesOptions);
  return prefs;
};
