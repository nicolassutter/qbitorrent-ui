import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { transferInfoGet } from "@/client";
import bytes from "bytes";
import { ThemeDropdown } from "./theme";
import { useMainData } from "@/hooks/useMainData";
import { useQuery } from "@tanstack/react-query";

export const Sidebar = () => {
  const transferQuery = useQuery({
    queryKey: ["transfer"],
    queryFn: async () => {
      const result = await transferInfoGet();
      return result.data;
    },
    refetchInterval: 2000,
  });

  const { serverState } = useMainData();

  return (
    <div className="h-svh flex flex-col gap-1 items-start w-80 bg-sidebar sticky top-0 left-0 p-2 shrink-0">
      <div className="h-full overflow-y-auto">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Card>
            <CardHeader>
              <CardTitle>Download speed</CardTitle>
            </CardHeader>
            <CardContent>
              {bytes(transferQuery.data?.dl_info_speed ?? 0, {
                unitSeparator: " ",
                decimalPlaces: 1,
              })}
              /s
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upload speed</CardTitle>
            </CardHeader>
            <CardContent>
              {bytes(transferQuery.data?.up_info_speed ?? 0, {
                unitSeparator: " ",
                decimalPlaces: 1,
              })}
              /s
            </CardContent>
          </Card>

          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>All time ratio</CardTitle>
            </CardHeader>
            <CardContent>{serverState.global_ratio}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All time download</CardTitle>
            </CardHeader>
            <CardContent>
              {bytes(serverState.alltime_dl, {
                unitSeparator: " ",
                decimalPlaces: 1,
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All time upload</CardTitle>
            </CardHeader>
            <CardContent>
              {bytes(serverState.alltime_ul, {
                unitSeparator: " ",
                decimalPlaces: 1,
              })}
            </CardContent>
          </Card>

          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>Free space</CardTitle>
            </CardHeader>
            <CardContent>
              {bytes(serverState.free_space_on_disk, {
                unitSeparator: " ",
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/*footer*/}
      <div className="mt-auto">
        <ThemeDropdown />
      </div>
    </div>
  );
};
