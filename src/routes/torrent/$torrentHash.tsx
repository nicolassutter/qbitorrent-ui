import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  torrentsFilePrioPost,
  torrentsFilesPost,
  torrentsInfoPost,
} from "@/client/sdk.gen";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Download,
  Upload,
  Clock,
  HardDrive,
  Users,
  Zap,
  LucideLink,
  Hash,
  Tag,
  Calendar,
  ChevronLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { priorityMap, TorrentFilesTree } from "@/components/TorrentFilesTree";
import { ComponentProps, useMemo, useState } from "react";
import { TorrentsFilePrioPostData } from "@/client";
import { TorrentProgress } from "@/components/TorrentProgress";
import {
  formatDate,
  formatDuration,
  formatSize,
  formatSpeed,
} from "@/lib/utils";

export const Route = createFileRoute("/torrent/$torrentHash")({
  component: Torrent,
});

export default function Torrent() {
  const params = Route.useParams();
  const torrentHash = params.torrentHash;

  const files = useQuery({
    queryKey: ["files", torrentHash],
    queryFn: async () => {
      const response = await torrentsFilesPost({
        body: {
          hash: torrentHash,
        },
      });

      return response.data;
    },
    refetchInterval: 2000,
  });

  const torrent = useQuery({
    queryKey: ["torrent", torrentHash],
    queryFn: async () => {
      const response = await torrentsInfoPost({
        body: {
          hashes: [torrentHash],
        },
      });

      return response.data?.[0] ?? null;
    },
    refetchInterval: 2000,
  });

  const [allFilesPriority, setAllFilesPriority] =
    useState<keyof typeof priorityMap>(0);

  const treeFiles = useMemo(() => {
    return (
      files.data?.map(
        (file): ComponentProps<typeof TorrentFilesTree>["files"][number] => {
          return {
            path: file.name ?? "",
            fileInfo: {
              status: file.is_seed
                ? "seeding"
                : file.progress === 1
                  ? "seeding"
                  : "downloading",
              progress: (file.progress ?? 0) * 100,
              size: file.size ?? 0,
              priority: file.priority,
              index: file.index,
            },
          };
        },
      ) ?? []
    );
  }, [files.data]);

  const filePriorityMutation = useMutation({
    mutationFn: async (body: TorrentsFilePrioPostData["body"]) => {
      await torrentsFilePrioPost({
        body: {
          ...body,
          // @ts-expect-error we manually transform the array to a string, Hey API doesn't do it
          id: body.id.join("|"),
        },
      });
    },
    async onSettled() {
      await files.refetch();
    },
  });

  return (
    <main className="">
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          Torrent Information
          <a href={torrent.data?.magnet_uri} className="break-all">
            <LucideLink className="inline mr-2 text-base" />
          </a>
        </h1>

        <Button asChild variant="link">
          <Link to="/" className="mb-4">
            <ChevronLeft aria-hidden="true"></ChevronLeft>
            Back
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 content-start">
                <p className="font-semibold break-all">{torrent.data?.name}</p>
                <div className="py-2">
                  {torrent.data && <TorrentProgress torrent={torrent.data} />}
                </div>
                {torrent.data?.added_on !== undefined && (
                  <p>
                    <Calendar className="inline mr-2" /> Added:{" "}
                    {formatDate(torrent.data.added_on)}
                  </p>
                )}
                {torrent.data?.completion_on !== undefined && (
                  <p>
                    <Calendar className="inline mr-2" /> Completed:{" "}
                    {formatDate(torrent.data.completion_on)}
                  </p>
                )}
                {torrent.data?.last_activity !== undefined && (
                  <p>
                    <Calendar className="inline mr-2" /> Last Activity:{" "}
                    {formatDate(torrent.data.last_activity)}
                  </p>
                )}
                <p>
                  <HardDrive className="inline mr-2" /> Save Path:{" "}
                  {torrent.data?.save_path}
                </p>
                <p>
                  <Tag className="inline mr-2" /> Category:{" "}
                  {torrent.data?.category}
                </p>
                <p>
                  <Users className="inline mr-2" />
                  Seeds / Peers: {torrent.data?.num_seeds} /{" "}
                  {torrent.data?.num_leechs}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transfer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <Download className="inline mr-2" /> Downloaded:{" "}
                  {torrent.data?.downloaded !== undefined &&
                    formatSize(torrent.data.downloaded)}
                </p>
                <p>
                  <Upload className="inline mr-2" /> Uploaded:{" "}
                  {torrent.data?.uploaded !== undefined &&
                    formatSize(torrent.data.uploaded)}
                </p>
                {torrent.data?.ratio !== undefined && (
                  <p>
                    <Zap className="inline mr-2" /> Ratio:{" "}
                    {torrent.data?.ratio?.toFixed(2)}
                  </p>
                )}
                <p>
                  <Download className="inline mr-2" /> Download Speed:{" "}
                  {torrent.data?.dlspeed !== undefined &&
                    formatSpeed(torrent.data.dlspeed)}
                </p>
                <p>
                  <Upload className="inline mr-2" /> Upload Speed:{" "}
                  {torrent.data?.upspeed !== undefined &&
                    formatSpeed(torrent.data.upspeed)}
                </p>
                <p>
                  <Clock className="inline mr-2" /> Time Active:{" "}
                  {torrent.data?.time_active !== undefined &&
                    formatDuration(torrent.data.time_active)}
                </p>
                <p>
                  <Clock className="inline mr-2" /> Seeding Time:{" "}
                  {torrent.data?.seeding_time !== undefined &&
                    formatDuration(torrent.data.seeding_time)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Miscellaneous</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div>
                <p className="font-medium">Tracker</p>
                <p className="break-all">{torrent.data?.tracker}</p>
              </div>

              <div>
                <p className="font-medium">Hash</p>
                <p className="break-all">
                  <Hash className="inline mr-2" />
                  {torrent.data?.hash}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="col-span-full">
            <Card>
              <CardHeader>
                <CardTitle>Torrent Files</CardTitle>

                <form
                  className="flex items-center gap-2 mt-2"
                  onSubmit={(e) => {
                    e.preventDefault();

                    if (allFilesPriority === undefined) return;

                    filePriorityMutation.mutate({
                      priority: allFilesPriority,
                      hash: torrentHash,
                      id:
                        files.data
                          ?.map((file) => file.index)
                          .filter((index) => index !== undefined) ?? [],
                    });
                  }}
                >
                  <Select
                    value={String(allFilesPriority)}
                    onValueChange={(v) => {
                      const value = Number(v) as typeof allFilesPriority;
                      setAllFilesPriority(value);
                    }}
                  >
                    <SelectTrigger
                      className="w-[180px]"
                      aria-label="set all files to selected priority"
                    >
                      <SelectValue placeholder="Theme" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(priorityMap).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button type="submit">Set all files to status</Button>
                </form>
              </CardHeader>

              <CardContent>
                {files.isPending && <p>Loading...</p>}
                {!files.isPending && !files.data?.length && (
                  <p>No files found</p>
                )}
                {!files.isPending && files.data?.length && (
                  <TorrentFilesTree
                    files={treeFiles}
                    handlePriorityChange={(priority, fileIndex) => {
                      filePriorityMutation.mutate({
                        hash: torrentHash,
                        id: [fileIndex],
                        priority,
                      });
                    }}
                  ></TorrentFilesTree>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
