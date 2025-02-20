import { TorrentInfo } from "@/client";
import { type FunctionComponent } from "react";
import { TorrentBadge } from "./TorrentBadge";
import { Progress } from "./ui/progress";
import { formatDuration, formatSize, toDecimals } from "@/lib/utils";

export const TorrentProgress: FunctionComponent<{
  torrent: TorrentInfo;
}> = ({ torrent }) => {
  const percentage = toDecimals((torrent.progress ?? 0) * 100, 2);
  const showEta = torrent.eta !== 8640000;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium flex items-center gap-2">
          Progress
          <TorrentBadge state={torrent.state} />
        </span>

        <span className="text-sm">
          {formatSize(torrent.size ?? 0)}
          {showEta && <>(ETA: {formatDuration(torrent.eta ?? 0)})</>}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Progress value={percentage} className="flex-grow" />
        <span className="text-sm font-medium">{percentage}%</span>
      </div>
    </div>
  );
};
