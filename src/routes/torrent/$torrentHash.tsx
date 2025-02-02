import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { torrentsFilesPost, torrentsInfoPost } from "@/client/sdk.gen";

import {
  Download,
  Upload,
  Clock,
  HardDrive,
  Users,
  Zap,
  Link,
  Hash,
  Tag,
  Calendar,
  File,
  CheckCircle,
  AlertCircle,
  BarChart2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQuery } from "@tanstack/react-query";
import bytes from "bytes";

const formatDate = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleString();
};

const formatSize = (b: number) => {
  return bytes(b, {
    unitSeparator: " ",
  });
};

const formatSpeed = (bytesPerSecond: number) => {
  return `${formatSize(bytesPerSecond)}/s`;
};

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};
const priorityLabels: Record<number, string> = {
  0: "Don't Download",
  1: "Normal",
  6: "High",
  7: "Maximum",
};

export const Route = createFileRoute("/torrent/$torrentHash")({
  component: Torrent,
});

export default function Torrent() {
  const params = Route.useParams();
  const torrentHash = params.torrentHash;

  const torrentOptions = queryOptions({
    get queryKey() {
      return ["torrent", torrentHash];
    },
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

  const files = useQuery({
    queryKey: ["files", torrentHash()],
    queryFn: async () => {
      const response = await torrentsFilesPost({
        body: {
          hash: torrentHash,
        },
      });

      return response.data;
    },
  });

  const torrent = useQuery(torrentOptions);

  return (
    <main className="">
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          Torrent Information
          <a href={torrent.data?.magnet_uri} className="break-all">
            <Link className="inline mr-2 text-base" />
          </a>
        </h1>

        <Button asChild variant="link">
          <Link to="/" className="mb-4">
            Back
          </Link>
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-semibold break-all">{torrent.data?.name}</p>
                {torrent.data?.added_on !== undefined && (
                  <p>
                    <Calendar className="inline mr-2" /> Added:{" "}
                    {formatDate(torrent.data?.added_on!)}
                  </p>
                )}
                {torrent.data?.completion_on !== undefined && (
                  <p>
                    <Calendar className="inline mr-2" /> Completed:{" "}
                    {formatDate(torrent.data?.completion_on!)}
                  </p>
                )}
                {torrent.data?.last_activity !== undefined && (
                  <p>
                    <Calendar className="inline mr-2" /> Last Activity:{" "}
                    {formatDate(torrent.data?.last_activity!)}
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
                <Badge
                  variant={
                    torrent.data?.state === "uploading"
                      ? "default"
                      : "secondary"
                  }
                >
                  {torrent.data?.state}
                </Badge>
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
                    {torrent.data?.ratio?.toFixed(3)}
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
              <CardTitle>Peers and Seeds</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <Users className="inline mr-2" /> Seeds:{" "}
                  {torrent.data?.num_seeds}
                </p>
                <p>
                  <Users className="inline mr-2" /> Leechers:{" "}
                  {torrent.data?.num_leechs}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress
                value={(torrent.data?.progress ?? 0) * 100}
                className="w-full"
              />

              <p className="mt-2">
                {((torrent.data?.progress ?? 0) * 100).toFixed(2)}% -{" "}
                {formatSize(torrent.data?.completed ?? 0)} /{" "}
                {formatSize(torrent.data?.size ?? 0)}
              </p>

              {torrent.data?.eta && (
                <p>
                  <Clock className="inline mr-2" /> ETA:{" "}
                  {torrent.data?.eta === 8640000
                    ? "∞"
                    : formatDuration(torrent.data?.eta!)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tracker</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="break-all">{torrent.data?.tracker}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hash</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="break-all">
                <Hash className="inline mr-2" /> {torrent.data?.hash}
              </p>
            </CardContent>
          </Card>

          <div className="col-span-full">
            <Card>
              <CardHeader>
                <CardTitle>Torrent Files</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  {/* TODO: virtualize list or add pagination */}
                  <TableBody>
                    {files.data?.map((file) => (
                      <TableRow>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <File className="mr-2" />
                            {file.name}
                          </div>
                        </TableCell>
                        <TableCell>{formatSize(file.size ?? 0)}</TableCell>
                        <TableCell>
                          <div className="w-full max-w-xs">
                            <Progress
                              value={(file.progress ?? 0) * 100}
                              className="w-full"
                            />
                            <span className="text-xs text-muted-foreground">
                              {((file.progress ?? 0) * 100).toFixed(2)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {file.priority
                              ? priorityLabels[file.priority]
                              : "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {file.is_seed ? (
                            <div className="flex items-center text-green-500">
                              <CheckCircle className="mr-1 text-base" />
                              Seeding
                            </div>
                          ) : file.progress === 1 ? (
                            <div className="flex items-center text-blue-500">
                              <BarChart2 className="mr-1 text-base" />
                              Completed
                            </div>
                          ) : (
                            <div className="flex items-center text-yellow-500">
                              <AlertCircle className="mr-1 text-base" />
                              Downloading
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
