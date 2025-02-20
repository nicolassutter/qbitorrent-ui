import { torrentsRenamePost } from "@/client";
import { signal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const state = {
  isOpen: signal(false),
  hash: signal<string | null>(null),
  currentName: signal<string>(""),
  reset() {
    this.isOpen.value = false;
    this.hash.value = null;
    this.currentName.value = "";
  },
};

export function useTorrentRenameDialog() {
  useSignals();
  const queryClient = useQueryClient();

  const renameTorrent = useMutation({
    mutationFn: async ({ hash, name }: { hash: string; name: string }) => {
      await torrentsRenamePost({
        body: {
          hash,
          name,
        },
      });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["torrents"],
      });
    },
  });

  return {
    open(hash: string, currentName: string | undefined) {
      state.isOpen.value = true;
      state.hash.value = hash;
      state.currentName.value = currentName ?? "";
    },
    close() {
      state.reset();
    },
    get isOpen() {
      return state.isOpen.value;
    },
    get hash() {
      return state.hash.value;
    },
    get currentName() {
      return state.currentName.value;
    },
    submit(newName: string) {
      if (state.hash.value) {
        renameTorrent.mutate(
          {
            hash: state.hash.value,
            name: newName,
          },
          {
            onSettled: () => {
              this.close();
            },
          },
        );
      }
    },
  };
}
