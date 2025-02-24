import { createFileRoute, useSearch } from "@tanstack/react-router";
import { torrentsInfoPost } from "@/client/sdk.gen";
import { useQuery } from "@tanstack/react-query";
import { TorrentCard } from "@/components/TorrentCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TorrentInfo } from "@/client";
import { useLocalStorage } from "react-use";
import { useEffect, useId, useMemo, useState } from "react";
import { createQueryParam } from "@/hooks/createQueryParam";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { CustomPagination } from "@/components/CustomPagination";
import { Toolbar } from "@/components/Toolbar";
import { Checkbox } from "@/components/ui/checkbox";
import { useTorrentDeletionDialog } from "@/hooks/useTorrentDeletionDialog";

const pageName = "p";
const SearchSchema = z.object({
  p: z.number().optional(),
});

export const Route = createFileRoute("/")({
  component: HomeComponent,
  validateSearch: SearchSchema,
});

export default function HomeComponent() {
  const defaultSort: keyof TorrentInfo = "added_on";
  const search = useSearch({ strict: false });
  const [page, setPage] = createQueryParam(search, "p", 1);

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
      (page - 1) * (perPage ?? perPageDefault),
      page * (perPage ?? perPageDefault),
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
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [pageCount, page]);

  const id = useId();

  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedTorrents, setSelectedTorrents] = useState<string[]>([]);
  // Clear selected torrents when selection mode is turned off
  useEffect(() => {
    if (!isSelecting) {
      setSelectedTorrents([]);
    }
  }, [isSelecting]);

  const torrentDeletionDialogState = useTorrentDeletionDialog();

  return (
    <main className="">
      <Toolbar
        isSelecting={isSelecting}
        onSelectionModeChange={setIsSelecting}
        onDelete={() => {
          if (selectedTorrents.length === 0) return;

          // if the form is submitted, exit selection mode
          torrentDeletionDialogState.onNextSubmit(() => {
            setIsSelecting(false);
          });
          torrentDeletionDialogState.open(selectedTorrents);
        }}
      />

      <div className="flex flex-col xl:flex-row xl:items-center gap-4 justify-between pt-4">
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
          <Label htmlFor={`text-filter-${id}`} className="shrink-0">
            Text filter
          </Label>
          <Input
            id={`text-filter-${id}`}
            type="text"
            placeholder="Ubuntu"
            value={textFilter}
            onChange={(e) => setTextFilter(e.target.value)}
            className="text-field"
          />
        </div>
      </div>

      <div className="mt-4 grid gap-1">
        <p>{torrents.data?.length ?? 0} torrents</p>
        {isSelecting && (
          <p>{selectedTorrents?.length ?? 0} selected torrents</p>
        )}
      </div>

      <div className="grid gap-2 mt-1">
        {currentPageTorrents.map((torrent) => (
          <div className="flex items-center gap-2" key={torrent.hash}>
            {isSelecting && (
              <Checkbox
                id={`torrentcard-${torrent.hash}`}
                className="cursor-pointer size-5"
                checked={selectedTorrents.includes(torrent.hash!)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedTorrents((prev) =>
                      [...prev, torrent.hash].filter(
                        (e) => typeof e === "string",
                      ),
                    );
                  } else {
                    setSelectedTorrents((prev) =>
                      prev.filter((hash) => hash !== torrent.hash),
                    );
                  }
                }}
              />
            )}

            <div className="relative w-full">
              {isSelecting && (
                <label
                  htmlFor={`torrentcard-${torrent.hash}`}
                  className="absolute inset-0 z-10 opacity-0 cursor-pointer"
                >
                  Select torrent {torrent.name}
                </label>
              )}
              <TorrentCard torrent={torrent} />
            </div>
          </div>
        ))}
      </div>

      {pageCount > 1 && (
        <div className="mt-4">
          <CustomPagination
            page={page}
            count={filteredTorrents.length}
            pageSize={perPage ?? perPageDefault}
            searchParam={pageName}
          ></CustomPagination>
        </div>
      )}
    </main>
  );
}
