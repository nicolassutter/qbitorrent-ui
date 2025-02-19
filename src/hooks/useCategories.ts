import { useMemo } from "react";
import { useMainData } from "./useMainData";

export const useCategories = () => {
  const { mainData } = useMainData();
  const cats = mainData.data?.categories;

  const categories = useMemo(() => {
    return Object.entries(cats ?? {}).reduce(
      (acc, [key, value]) => {
        if (!value.name) return acc;

        acc.push({
          key,
          name: value.name,
          savePath: value.savePath,
        });

        return acc;
      },
      [] as { key: string; name: string; savePath?: string }[],
    );
  }, [cats]);

  return {
    categories,
    pending: mainData.isPending,
  };
};
