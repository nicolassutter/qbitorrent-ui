import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { FunctionComponent, ReactNode, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export const TorrentDeletionDialog: FunctionComponent<{
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (deleteFiles: boolean) => void;
  children?: ReactNode;
}> = ({ isOpen, onOpenChange, onSubmit, children }) => {
  const [deleteFiles, setDeleteFiles] = useState(false);
  const id = useId();
  const checkboxId = `deleteFiles-${id}`;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}

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
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" onClick={() => onSubmit(deleteFiles)}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
