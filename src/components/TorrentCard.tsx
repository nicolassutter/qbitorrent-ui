import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TorrentInfo } from "@/client/types.gen";
import { Badge } from "./ui/badge";
import bytes from "bytes";
import { Progress } from "./ui/progress";
import { LucideLoaderCircle, LucideTrash } from "lucide-react";
import { FunctionComponent, useId, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { cn, toDecimals } from "@/lib/utils";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { torrentsDeletePost } from "@/client";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";

export type TorrentContextMenuProps = {
  children: ReactNode;
  onDelete?: () => void;
};
const TorrentContextMenu = ({
  children,
  onDelete,
}: TorrentContextMenuProps) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem onSelect={() => onDelete?.()}>
          <LucideTrash />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export const TorrentDeletionDialog: FunctionComponent<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (deleteFiles: boolean) => void;
}> = ({ isOpen, onClose, onSubmit }) => {
  const [deleteFiles, setDeleteFiles] = useState(false);
  const id = useId();
  const checkboxId = `deleteFiles-${id}`;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(v) => {
        if (!v) {
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete torrent</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this torrent?
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
          <Checkbox
            checked={deleteFiles}
            onCheckedChange={(v) => {
              if (typeof v === "boolean") setDeleteFiles(v);
            }}
            id={checkboxId}
          />
          <div className="flex flex-col gap-2 leading-none">
            <Label htmlFor={checkboxId} className="block">
              Delete the torrent&apos;s files ?
            </Label>
            <p className="text-sm text-muted-foreground">
              This will{" "}
              <span className="font-bold text-foreground">permanently</span>{" "}
              delete the torrent&apos;s files from your device.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => onSubmit(deleteFiles)}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const TorrentCard: FunctionComponent<{
  torrent: TorrentInfo;
}> = (props) => {
  const torrent = props.torrent;

  const [deletionDialogOpen, setDeletionDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
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

  const torrentProgress = toDecimals((torrent.progress ?? 0) * 100, 2);

  return (
    <>
      <TorrentContextMenu
        onDelete={() => {
          setDeletionDialogOpen(true);
        }}
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
        onClose={() => setDeletionDialogOpen(false)}
        onSubmit={(deleteFiles) => {
          deleteMutation.mutate(deleteFiles);
        }}
      ></TorrentDeletionDialog>
    </>
  );
};
