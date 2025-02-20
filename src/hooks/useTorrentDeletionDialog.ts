import { torrentsDeletePost } from "@/client";
import { signal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const state = {
  isOpen: signal(false),
  hashes: signal<string[]>([]),
  onSubmitCallbacks: new Set<() => void>(),
  reset() {
    this.isOpen.value = false;
    this.hashes.value = [];
    this.onSubmitCallbacks.clear();
  },
};

export function useTorrentDeletionDialog() {
  useSignals();
  const queryClient = useQueryClient();

  const deleteTorrents = useMutation({
    mutationFn: async ({
      deleteFiles,
      hashes,
    }: {
      hashes: string[];
      deleteFiles: boolean;
    }) => {
      await torrentsDeletePost({
        body: {
          // @ts-expect-error hashes should be a string
          hashes: hashes.join("|"),
          deleteFiles,
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
    open(torrentHashes: string[]) {
      state.isOpen.value = true;
      state.hashes.value = torrentHashes;
    },
    close() {
      state.reset();
    },
    get isOpen() {
      return state.isOpen.value;
    },
    get hashes() {
      return state.hashes.value;
    },
    submit(deleteFiles: boolean) {
      deleteTorrents.mutate(
        {
          hashes: state.hashes.value,
          deleteFiles,
        },
        {
          onSettled: () => {
            state.onSubmitCallbacks.forEach((cb) => cb());
            this.close();
          },
        },
      );
    },
    onNextSubmit(cb: () => void) {
      state.onSubmitCallbacks.add(cb);
    },
  };
}
