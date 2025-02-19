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
import { torrentsAddPost } from "@/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LucidePlus,
  LucideSquare,
  LucideSquareX,
  LucideTrash,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  CSSProperties,
  FunctionComponent,
  ReactNode,
  useEffect,
  useId,
  useState,
} from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { usePreferences } from "@/hooks/usePreferences";
import { useCategories } from "@/hooks/useCategories";
import { useSetState } from "react-use";
import { TorrentDeletionDialog } from "./TorrentDeletionDialog";

type TorrentAdditionData = {
  torrentSource: string | File;
  savePath: string;
  category?: string;
};

export const TorrentAdditionDialog: FunctionComponent<{
  onSubmit: (data: TorrentAdditionData) => void | Promise<void>;
  children: ReactNode;
  defaultSavePath?: string;
}> = ({ onSubmit, children }) => {
  const preferences = usePreferences();
  const defaultSavePath = preferences.data?.save_path;
  const [dialogOpen, setDialogOpen] = useState(false);

  const defaultState = {
    torrentSource: "",
    savePath: defaultSavePath,
    category: undefined as string | undefined,
    torrentFile: undefined as File | undefined,
  };
  const [{ torrentSource, torrentFile, savePath, category }, setState] =
    useSetState(defaultState);

  useEffect(() => {
    if (preferences.data && !savePath) {
      setState({ savePath: preferences.data.save_path ?? undefined });
    }
  }, [preferences.data, savePath]);

  const id = useId();
  const inputId = `torrentSource-${id}`;
  const fileInputId = `torrentSourceFile-${id}`;
  const savePathId = `savePath-${id}`;

  // reset state when dialog is closed
  useEffect(() => {
    if (!dialogOpen) {
      setState(defaultState);
    }
  }, [dialogOpen]);

  async function handleSubmit() {
    const source = torrentSource || torrentFile;
    if (!source) return;

    const finalSavePath = savePath || defaultSavePath;

    if (!finalSavePath) {
      console.error("Save path is required");
      return;
    }

    await onSubmit({
      torrentSource: source,
      savePath: finalSavePath,
      category,
    });

    setDialogOpen(false);
  }

  const { categories, pending: categoriesPending } = useCategories();

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Torrent</DialogTitle>
          <DialogDescription>
            Enter a magnet link or upload a torrent file to add a new torrent.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-4">
          {!torrentFile && (
            <>
              <Label htmlFor={inputId} className="block">
                Magnet link
              </Label>

              <Input
                id={inputId}
                type="text"
                placeholder="Enter magnet link"
                value={torrentSource}
                onChange={(e) => setState({ torrentSource: e.target.value })}
                className="text-field"
              />
            </>
          )}

          {torrentSource === "" && (
            <>
              <Label htmlFor={fileInputId} className="block">
                Or upload a torrent file
              </Label>

              <Input
                type="file"
                accept=".torrent"
                id={fileInputId}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setState({ torrentFile: file });
                  }
                }}
              />
            </>
          )}

          <Label htmlFor={savePathId} className="block">
            Save Path
          </Label>

          <Input
            id={savePathId}
            type="text"
            placeholder="Enter save path"
            value={savePath}
            onChange={(e) =>
              setState({
                savePath: e.target.value,
              })
            }
            className="text-field"
          />

          {categoriesPending && <p>Loading categories...</p>}

          {categories.length > 0 && (
            <>
              <Label htmlFor="category" className="block">
                Category
              </Label>

              <Select
                value={category}
                onValueChange={(value) =>
                  setState({
                    category: value,
                  })
                }
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.key} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>

          <DialogClose asChild>
            <Button
              variant="default"
              onClick={handleSubmit}
              disabled={!torrentSource && !torrentFile}
            >
              Add Torrent
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
export const Toolbar: FunctionComponent<{
  isSelecting: boolean;
  onSelectionModeChange: (isSelectionMode: boolean) => void;
  onDelete: (deleteFiles: boolean) => void | Promise<void>;
}> = (props) => {
  const queryClient = useQueryClient();

  const torrentAddMutation = useMutation({
    mutationFn: async (data: TorrentAdditionData) => {
      await torrentsAddPost({
        body: {
          urls:
            [data.torrentSource]
              .filter((s) => typeof s === "string")
              .join("\n") || undefined,
          torrents: [data.torrentSource].filter((s) => s instanceof File),
          savepath: data.savePath,
          category: data.category || undefined,
        },
      });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["torrents"],
      });
    },
  });

  const [deletionDialogOpen, setDeletionDialogOpen] = useState(false);

  return (
    <div
      className="toolbar sticky top-0 -mt-(--offset) pt-(--offset) z-50 bg-background/90 backdrop-blur-lg"
      style={{ "--offset": "calc(var(--spacing) * 2)" } as CSSProperties}
    >
      <div className="flex items-center gap-2 bg-sidebar rounded-sm p-2">
        <Button
          variant="ghost"
          size={"icon"}
          title={
            props.isSelecting ? "Exit selection mode" : "Enter selection mode"
          }
          className="ml-auto"
          onClick={() => props.onSelectionModeChange(!props.isSelecting)}
        >
          {props.isSelecting ? (
            <LucideSquareX aria-hidden="true" />
          ) : (
            <LucideSquare aria-hidden="true" />
          )}
        </Button>

        {props.isSelecting && (
          <TorrentDeletionDialog
            isOpen={deletionDialogOpen}
            onOpenChange={setDeletionDialogOpen}
            onSubmit={async (deleteFiles) => {
              await props.onDelete(deleteFiles);
              setDeletionDialogOpen(false);
            }}
          >
            <Button
              variant="ghost"
              size={"icon"}
              title="Delete selected torrents"
            >
              <LucideTrash aria-hidden="true" />
            </Button>
          </TorrentDeletionDialog>
        )}

        <TorrentAdditionDialog
          onSubmit={async (data) => {
            try {
              return torrentAddMutation.mutateAsync(data);
              // eslint-disable-next-line no-empty
            } catch (_error) {}
          }}
        >
          <Button variant="ghost" size={"icon"} title="Add Torrent">
            <LucidePlus aria-hidden="true" />
          </Button>
        </TorrentAdditionDialog>
      </div>
    </div>
  );
};
