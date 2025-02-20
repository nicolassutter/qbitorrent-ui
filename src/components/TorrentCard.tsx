import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TorrentInfo } from "@/client/types.gen";
import {
  ChevronDown,
  LucidePause,
  LucidePencilLine,
  LucidePlay,
  LucideShapes,
  LucideTrash,
} from "lucide-react";
import { FunctionComponent, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { formatDate, formatSize, formatSpeed } from "@/lib/utils";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  torrentsPausePost,
  torrentsResumePost,
  torrentsSetCategoryPost,
} from "@/client";
import { useAppVersion } from "@/hooks/useVersion";
import { useCategories } from "@/hooks/useCategories";
import { useTorrentDeletionDialog } from "@/hooks/useTorrentDeletionDialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { Button } from "./ui/button";
import { TorrentProgress } from "./TorrentProgress";
import { useTorrentRenameDialog } from "@/hooks/useTorrentRenameDialog";

export type TorrentContextMenuProps = {
  children: ReactNode;
  className?: string;
  onDelete: () => void;
  onPause: () => void;
  onStart: () => void;
  onRename: () => void;
  onSetCategory: (category: string) => void;
  /** The category of the torrent */
  category?: string;
};
const TorrentContextMenu = ({
  children,
  onDelete,
  onPause,
  onStart,
  onSetCategory,
  onRename,
  category,
  className,
}: TorrentContextMenuProps) => {
  const { categories } = useCategories();

  return (
    <ContextMenu>
      <ContextMenuTrigger className={className}>{children}</ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem
          onSelect={() => {
            onStart?.();
          }}
        >
          <LucidePlay className="text-popover-foreground" />
          Start
        </ContextMenuItem>

        <ContextMenuItem
          onSelect={() => {
            onPause?.();
          }}
        >
          <LucidePause className="text-popover-foreground" />
          Pause
        </ContextMenuItem>

        <ContextMenuSeparator />

        {categories.length > 0 && (
          <>
            <ContextMenuSub>
              <ContextMenuSubTrigger className="gap-2">
                <LucideShapes className="text-popover-foreground" />
                Set category
              </ContextMenuSubTrigger>

              <ContextMenuSubContent className="w-48">
                <ContextMenuRadioGroup
                  value={category}
                  onValueChange={(value) => {
                    onSetCategory?.(value);
                  }}
                >
                  <ContextMenuLabel inset>Categories</ContextMenuLabel>
                  <ContextMenuSeparator />
                  {categories.map((category) => (
                    <ContextMenuRadioItem
                      key={category.key}
                      value={category.key}
                    >
                      {category.name}
                    </ContextMenuRadioItem>
                  ))}
                  <ContextMenuRadioItem value={""}>
                    (No category)
                  </ContextMenuRadioItem>
                </ContextMenuRadioGroup>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </>
        )}

        <ContextMenuItem
          onSelect={() => {
            onRename?.();
          }}
        >
          <LucidePencilLine className="text-popover-foreground" />
          Rename
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem
          onSelect={() => {
            onDelete?.();
          }}
        >
          <LucideTrash className="text-popover-foreground" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export const TorrentCard: FunctionComponent<{
  torrent: TorrentInfo;
  className?: string;
}> = (props) => {
  const torrent = props.torrent;

  const [isExpanded, setIsExpanded] = useState(false);
  const queryClient = useQueryClient();
  const { isV5orHigher } = useAppVersion();

  const torrentDeletionDialogState = useTorrentDeletionDialog();
  const torrentRenameDialogState = useTorrentRenameDialog();

  const startTorrent = useMutation({
    mutationFn: async () => {
      if (!torrent.hash) return;

      await torrentsResumePost({
        // v5+ has a different endpoint for starting torrents
        ...(typeof isV5orHigher === "boolean" && isV5orHigher
          ? { url: "/torrents/start" }
          : {}),
        body: {
          hashes: [torrent.hash],
        },
      });
    },
    // starting a torrent takes a few seconds, so we don't need to invalidate the cache
    // since the torrents query will be updated on the next interval
  });

  const pauseTorrent = useMutation({
    mutationFn: async () => {
      if (!torrent.hash) return;

      await torrentsPausePost({
        // v5+ has a different endpoint for pausing torrents
        ...(typeof isV5orHigher === "boolean" && isV5orHigher
          ? { url: "/torrents/stop" }
          : {}),
        body: {
          hashes: [torrent.hash],
        },
      });
    },
    // pausing a torrent takes a few seconds, so we don't need to invalidate the cache
    // since the torrents query will be updated on the next interval
  });

  const setTorrentCategory = useMutation({
    mutationFn: async (category: string) => {
      if (!torrent.hash) return;

      await torrentsSetCategoryPost({
        body: {
          hashes: [torrent.hash],
          category,
        },
      });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["torrents"],
      });
    },
  });

  return (
    <>
      <TorrentContextMenu
        onDelete={() => {
          if (!torrent.hash) return;
          torrentDeletionDialogState.open([torrent.hash]);
        }}
        onRename={() => {
          if (!torrent.hash) return;
          torrentRenameDialogState.open(torrent.hash ?? "", torrent.name);
        }}
        onStart={() => {
          startTorrent.mutate();
        }}
        onPause={() => {
          pauseTorrent.mutate();
        }}
        category={torrent.category}
        onSetCategory={(category) => {
          setTorrentCategory.mutate(category);
        }}
        className={props.className}
      >
        <Card className="relative">
          <CardHeader>
            <CardTitle className="break-all">
              <Link
                to={`/torrent/$torrentHash`}
                params={{
                  torrentHash: torrent.hash ?? "",
                }}
                className="underline underline-offset-4 leading-snug hover:text-foreground/80 transition-colors"
              >
                {torrent.name}
              </Link>
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4">
              <TorrentProgress torrent={torrent} />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <p className="text-sm font-medium">UP speed</p>
                  <p className="text-sm">{formatSpeed(torrent.upspeed ?? 0)}</p>
                </div>

                <div>
                  <p className="text-sm font-medium">DL speed</p>
                  <p className="text-sm">{formatSpeed(torrent.dlspeed ?? 0)}</p>
                </div>

                <div>
                  <p className="text-sm font-medium">Ratio</p>
                  <p className="text-sm">{torrent.ratio?.toFixed(2) ?? 0}</p>
                </div>

                <div>
                  <p className="text-sm font-medium">Seeds / Peers</p>
                  <p className="text-sm">
                    {torrent.num_seeds} / {torrent.num_leechs}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium">Category</p>
                  <p className="text-sm">
                    {torrent.category || "Uncategorized"}
                  </p>
                </div>
              </div>

              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    {isExpanded ? "Hide details" : "Show more details"}
                    <ChevronDown
                      className={`h-4 w-4 ml-2 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="text-sm font-medium">Tags</p>
                      <p className="text-sm">
                        {torrent.tags?.split(",")?.join(", ") || "None"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Added on</p>
                      <p className="text-sm">
                        {formatDate(torrent.added_on ?? 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Uploaded</p>
                      <p className="text-sm">
                        {formatSize(torrent.uploaded ?? 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Downloaded</p>
                      <p className="text-sm">
                        {formatSize(torrent.downloaded ?? 0)}
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <p className="text-sm font-medium">Save Path</p>
                      <p className="text-sm break-all">{torrent.save_path}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium">Hash</p>
                      <p className="text-sm break-all">{torrent.hash}</p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </CardContent>
        </Card>
      </TorrentContextMenu>
    </>
  );
};
