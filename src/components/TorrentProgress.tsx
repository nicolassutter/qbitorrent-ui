import { TorrentInfo } from "@/client";
import { type FunctionComponent } from "react";
import { TorrentBadge } from "./TorrentBadge";
import { Progress } from "./ui/progress";
import { formatDuration, formatSize } from "@/lib/utils";

export const TorrentProgress: FunctionComponent<{
  torrent: TorrentInfo;
}> = ({ torrent }) => {
  const percentage = (torrent.progress ?? 0) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium flex items-center gap-2">
          Progress
          <TorrentBadge state={torrent.state} />
        </span>

        <span className="text-sm">
          {formatSize(torrent.size ?? 0)}
          {percentage < 100 && <>(ETA: {formatDuration(torrent.eta ?? 0)})</>}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Progress value={percentage} className="flex-grow" />
        <span className="text-sm font-medium">{percentage}%</span>
      </div>
    </div>
  );
};
