import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { FunctionComponent, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useTorrentDeletionDialog } from "@/hooks/useTorrentDeletionDialog";
import { useSignalEffect } from "@preact/signals-react";

export const TorrentDeletionDialog: FunctionComponent = () => {
  const [deleteFiles, setDeleteFiles] = useState(false);
  const id = useId();
  const checkboxId = `deleteFiles-${id}`;
  const torrentDeletionDialogState = useTorrentDeletionDialog();

  useSignalEffect(() => {
    // Reset the delete files state when the dialog is closed
    if (!torrentDeletionDialogState.isOpen) {
      setDeleteFiles(false);
    }
  });

  return (
    <Dialog
      open={torrentDeletionDialogState.isOpen}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          torrentDeletionDialogState.close();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {/* Delete x torrent(s) */}
            Delete {torrentDeletionDialogState.hashes.length}{" "}
            {torrentDeletionDialogState.hashes.length > 1
              ? "torrents"
              : "torrent"}
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the selected torrent?
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
              Delete the torrents files ?
            </Label>
            <p className="text-sm text-muted-foreground">
              This will{" "}
              <span className="font-bold text-foreground">permanently</span>{" "}
              delete the torrents files from your device.
            </p>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={() => torrentDeletionDialogState.submit(deleteFiles)}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
