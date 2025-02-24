import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { type FunctionComponent } from "react";
import { LucideLoaderCircle } from "lucide-react";
import { TorrentInfo } from "@/client";
import { LiteralUnion } from "type-fest";

const torrentStatusMap = {
  uploading: "Uploading",
  allocating: "Allocating",
  checkingDL: "Checking DL",
  checkingResumeData: "Checking Resume Data",
  checkingUP: "Checking UP",
  downloading: "Downloading",
  error: "Error",
  forcedDL: "Forced DL",
  forcedUP: "Forced UP",
  metaDL: "Meta DL",
  moving: "Moving",
  queuedDL: "Queued DL",
  queuedUP: "Queued UP",
  stalledDL: "Stalled DL",
  stalledUP: "Stalled UP",
  missingFiles: "Missing Files",
  // pause === stop in qBitTorrent v5
  pausedDL: "Paused DL",
  stoppedDL: "Stopped DL",
  pausedUP: "Paused UP",
  stoppedUP: "Stopped UP",
  // default
  unknown: "Unknown",
} satisfies Record<
  LiteralUnion<NonNullable<TorrentInfo["state"]>, string>,
  string
>;

function getStatusText(state: TorrentInfo["state"]) {
  return state ? (torrentStatusMap[state] ?? state) : torrentStatusMap.unknown;
}

export const TorrentBadge: FunctionComponent<{
  state: TorrentInfo["state"];
}> = ({ state }) => {
  return (
    <Badge
      className={cn({
        "bg-indigo-600 dark:bg-indigo-400": state === "uploading",
        "bg-red-600 dark:bg-red-300": state === "error",
        "bg-blue-600 dark:bg-blue-400": state === "stalledUP",
        "bg-orange-600 dark:bg-orange-300": state === "moving",
        "bg-green-600 dark:bg-green-300": state === "downloading",
      })}
    >
      {getStatusText(state)}
      {(state === "uploading" ||
        state === "downloading" ||
        state === "moving") && (
        <LucideLoaderCircle className="w-4 h-4 ml-1 animate-spin" />
      )}
    </Badge>
  );
};
