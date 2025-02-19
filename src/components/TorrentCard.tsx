import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TorrentInfo } from "@/client/types.gen";
import { Badge } from "./ui/badge";
import bytes from "bytes";
import { Progress } from "./ui/progress";
import {
  LucideLoaderCircle,
  LucidePause,
  LucidePlay,
  LucideShapes,
  LucideTrash,
} from "lucide-react";
import { FunctionComponent, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { cn, toDecimals } from "@/lib/utils";
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
  torrentsDeletePost,
  torrentsPausePost,
  torrentsResumePost,
  torrentsSetCategoryPost,
} from "@/client";
import { useAppVersion } from "@/hooks/useVersion";
import { useCategories } from "@/hooks/useCategories";
import { TorrentDeletionDialog } from "./TorrentDeletionDialog";

export type TorrentContextMenuProps = {
  children: ReactNode;
  className?: string;
  onDelete?: () => void;
  onPause?: () => void;
  onStart?: () => void;
  onSetCategory?: (category: string) => void;
  /** The category of the torrent */
  category?: string;
};
const TorrentContextMenu = ({
  children,
  onDelete,
  onPause,
  onStart,
  onSetCategory,
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

            <ContextMenuSeparator />
          </>
        )}

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

  const [deletionDialogOpen, setDeletionDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { isV5orHigher } = useAppVersion();

  const deleteTorrent = useMutation({
    mutationFn: async (deleteFiles: boolean) => {
      if (!torrent.hash) return;

      await torrentsDeletePost({
        body: {
          hashes: [torrent.hash],
          deleteFiles: deleteFiles,
        },
      });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["torrents"],
      });
    },
  });

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

  const torrentProgress = toDecimals((torrent.progress ?? 0) * 100, 2);

  return (
    <>
      <TorrentContextMenu
        onDelete={() => {
          setDeletionDialogOpen(true);
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
              >
                {torrent.name}
              </Link>
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
                    "bg-blue-600 dark:bg-blue-400":
                      torrent.state === "stalledUP",
                    "bg-orange-600 dark:bg-orange-300":
                      torrent.state === "moving",
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
                  <Progress value={torrentProgress} />
                  <p>{torrentProgress}%</p>
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
      </TorrentContextMenu>

      <TorrentDeletionDialog
        isOpen={deletionDialogOpen}
        onOpenChange={setDeletionDialogOpen}
        onSubmit={(deleteFiles) => {
          deleteTorrent.mutate(deleteFiles, {
            onSettled() {
              setDeletionDialogOpen(false);
            },
          });
        }}
      ></TorrentDeletionDialog>
    </>
  );
};
