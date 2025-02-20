"use client";

import type React from "react";

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
import { Input } from "@/components/ui/input";
import { type FunctionComponent, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTorrentRenameDialog } from "@/hooks/useTorrentRenameDialog";
import { useSignalEffect } from "@preact/signals-react";

export const TorrentRenameDialog: FunctionComponent = () => {
  const [newName, setNewName] = useState("");
  const torrentRenameDialogState = useTorrentRenameDialog();

  useSignalEffect(() => {
    // Reset the new name state when the dialog is opened
    if (torrentRenameDialogState.isOpen) {
      setNewName(torrentRenameDialogState.currentName);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    torrentRenameDialogState.submit(newName);
  };

  return (
    <Dialog
      open={torrentRenameDialogState.isOpen}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          torrentRenameDialogState.close();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Torrent</DialogTitle>
          <DialogDescription>
            Enter a new name for the selected torrent.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Rename</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
