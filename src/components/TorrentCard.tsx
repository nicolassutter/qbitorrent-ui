import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TorrentInfo } from "@/client/types.gen";
import { Badge } from "./ui/badge";
import bytes from "bytes";
import { Progress } from "./ui/progress";
import { LucideLoaderCircle } from "lucide-react";
import { FunctionComponent } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export const TorrentCard: FunctionComponent<{
  torrent: TorrentInfo;
}> = (props) => {
  const torrent = props.torrent;

  return (
    <Card className="relative">
      <CardHeader>
        <CardTitle className="break-all">
          <Link to={`/torrent/${torrent.hash}`}>{torrent.name}</Link>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex flex-wrap gap-10">
          <div>
            <p>State</p>
            <Badge
              className={cn({
                "bg-indigo-600 dark:bg-indigo-400":
                  torrent.state === "uploading",
                "bg-red-600 dark:bg-red-300": torrent.state === "error",
                "bg-blue-600 dark:bg-blue-400": torrent.state === "stalledUP",
                "bg-orange-600 dark:bg-orange-300": torrent.state === "moving",
                "bg-green-600 dark:bg-green-300":
                  torrent.state === "downloading",
              })}
            >
              <p>{torrent.state}</p>

              {(torrent.state === "uploading" ||
                torrent.state === "downloading" ||
                torrent.state === "moving") && (
                <LucideLoaderCircle className="w-4 h-4 ml-1 animate-spin" />
              )}
            </Badge>
          </div>

          <div className="w-full max-w-56">
            <p>Progress</p>
            <div className="flex gap-1 items-center">
              <Progress value={(torrent.progress ?? 0) * 100} />
              <p>{(torrent.progress ?? 0) * 100}%</p>
            </div>
          </div>

          <div>
            <p>UP speed</p>
            <p>
              {bytes(torrent.upspeed ?? 0, {
                unitSeparator: " ",
              })}
              /s
            </p>
          </div>

          <div>
            <p>DL speed</p>
            <p>
              {bytes(torrent.dlspeed ?? 0, {
                unitSeparator: " ",
              })}
              /s
            </p>
          </div>

          <div>
            <p>Uploaded</p>
            <p>
              {bytes(torrent.uploaded ?? 0, {
                unitSeparator: " ",
              })}
            </p>
          </div>

          <div>
            <p>Downloaded</p>
            <p>
              {bytes(torrent.downloaded ?? 0, {
                unitSeparator: " ",
              })}
            </p>
          </div>

          <div>
            <p>Ratio</p>
            <p>{torrent.ratio?.toFixed(2) ?? 0}</p>
          </div>

          {/*TODO: size,eta,tags,categories,total_size */}
        </div>
      </CardContent>
    </Card>
  );
};
