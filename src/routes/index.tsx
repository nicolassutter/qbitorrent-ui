import { createFileRoute } from "@tanstack/react-router";
import { torrentsAddPost, torrentsInfoPost } from "@/client/sdk.gen";
import { useMutation, useQuery } from "@tanstack/react-query";
import { TorrentCard } from "@/components/TorrentCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Switch } from "@/components/ui/switch";
import { TorrentInfo } from "@/client";
import { useLocalStorage, useSetState } from "react-use";
import {
  FunctionComponent,
  ReactNode,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import { Label } from "@/components/ui/label";
import { createQueryParam } from "@/hooks/createQueryParam";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { CustomPagination } from "@/components/CustomPagination";
import { Button } from "@/components/ui/button";
import { LucidePlus } from "lucide-react";
import { useMainData } from "@/hooks/useMainData";
import { usePreferences } from "@/hooks/usePreferences";

const pageName = "p";
const SearchSchema = z.object({
  p: z.number().optional(),
});

export const Route = createFileRoute("/")({
  component: HomeComponent,
  validateSearch: SearchSchema,
});

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

  const { mainData } = useMainData();
  const cats = mainData.data?.categories;

  const categories = useMemo(() => {
    return Object.entries(cats ?? {}).reduce(
      (acc, [key, value]) => {
        if (!value.name) return acc;

        acc.push({
          key,
          name: value.name,
          savePath: value.savePath,
        });

        return acc;
      },
      [] as { key: string; name: string; savePath?: string }[],
    );
  }, [cats]);

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

          {mainData.isPending && <p>Loading categories...</p>}

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

export default function HomeComponent() {
  const defaultSort: keyof TorrentInfo = "added_on";
  const [page, setPage] = createQueryParam(pageName, 1);

  const [sort, setSort] = useLocalStorage<keyof TorrentInfo>(
    "qbitorrent-ui-sort",
    defaultSort,
  );
  const [reverse, setReverse] = useState(true);
  const [textFilter, setTextFilter] = useState("");

  const perPageDefault = 10;
  const [perPage, setPerPage] = useLocalStorage(
    "qbitorrent-ui-perPage",
    perPageDefault,
  );

  const torrentsOptions = {
    queryKey: ["torrents", sort, reverse],
    queryFn: async () => {
      const torrents = await torrentsInfoPost({
        body: {
          reverse: reverse,
          sort: sort,
        },
      });
      return torrents.data;
    },
    refetchInterval: 2000,
  };

  const torrents = useQuery(torrentsOptions);

  const filteredTorrents = useMemo(() => {
    return (
      torrents.data?.filter((torrent) =>
        torrent?.name?.toLowerCase().includes(textFilter.toLowerCase()),
      ) ?? []
    );
  }, [torrents.data, textFilter]);

  useEffect(() => {
    if (textFilter !== "") {
      setPage(1);
    }
  }, [textFilter]);

  const currentPageTorrents = useMemo(() => {
    return filteredTorrents.slice(
      (page() - 1) * (perPage ?? perPageDefault),
      page() * (perPage ?? perPageDefault),
    );
  }, [filteredTorrents, page, perPage]);

  const pageCount = useMemo(() => {
    const count = Math.ceil(
      filteredTorrents.length / (perPage ?? perPageDefault),
    );
    return Math.max(count, 1);
  }, [filteredTorrents, perPage]);

  // If the page is greater than the page count, set the page to the last page
  useEffect(() => {
    if (page() > pageCount) {
      setPage(pageCount);
    }
  }, [pageCount, page()]);

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
      await torrents.refetch();
    },
  });

  const id = useId();

  return (
    <main className="">
      <div className="flex flex-col xl:flex-row xl:items-center gap-4 justify-between">
        <div className="flex items-center gap-[inherit] shrink-0">
          <div className="grid gap-2">
            <Label htmlFor={`per-page-${id}`} className="text-sm">
              Per page
            </Label>

            <Select
              value={String(perPage ?? perPageDefault)}
              onValueChange={(page) => setPerPage(Number(page))}
            >
              <SelectTrigger
                className="w-full max-w-56 shrink-0 gap-1"
                id={`per-page-${id}`}
              >
                <SelectValue placeholder="Per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={perPageDefault.toString()}>
                  {perPageDefault}
                </SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="300">300</SelectItem>
                <SelectItem value="500">500</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`sort-${id}`} className="text-sm">
              Sort by
            </Label>

            <Select
              value={sort}
              onValueChange={(v) => setSort(v as keyof TorrentInfo)}
            >
              <SelectTrigger
                className="w-full max-w-56 shrink-0 gap-1"
                id={`sort-${id}`}
              >
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="added_on">Added On</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="upspeed">Upload Speed</SelectItem>
                <SelectItem value="dlspeed">Download Speed</SelectItem>
                <SelectItem value="ratio">Ratio</SelectItem>
                <SelectItem value="uploaded">Uploaded</SelectItem>
                <SelectItem value="downloaded">Downloaded</SelectItem>
                <SelectItem value="size">Size</SelectItem>
                <SelectItem value="total_size">Total Size</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end mb-1">
            <Switch
              id="reverse-sort-order"
              checked={reverse}
              onCheckedChange={setReverse}
            />
            <Label
              htmlFor="reverse-sort-order"
              className="text-sm font-medium leading-none"
            >
              Reverse sort order
            </Label>
          </div>
        </div>

        <div className="w-full max-w-80 flex items-center gap-2">
          <Label className="shrink-0">Text filter</Label>
          <Input
            type="text"
            placeholder="Ubuntu"
            value={textFilter}
            onChange={(e) => setTextFilter(e.target.value)}
            className="text-field"
          />
        </div>
      </div>

      <div className="flex gap-2 mt-2">
        <TorrentAdditionDialog
          onSubmit={async (data) => {
            try {
              return torrentAddMutation.mutateAsync(data);
            } catch (_error) {}
          }}
        >
          <Button variant="default">
            <LucidePlus />
            Add Torrent
          </Button>
        </TorrentAdditionDialog>
      </div>

      <div className="grid gap-2 mt-4">
        {currentPageTorrents.map((torrent) => (
          <TorrentCard key={torrent.hash} torrent={torrent} />
        ))}
      </div>

      {pageCount > 1 && (
        <div className="mt-4">
          <CustomPagination
            page={page()}
            count={filteredTorrents.length}
            pageSize={perPage ?? perPageDefault}
            searchParam={pageName}
          ></CustomPagination>
        </div>
      )}
    </main>
  );
}
