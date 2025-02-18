import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { TreeView, createTreeCollection } from "@ark-ui/react/tree-view";
import { ChevronDown, ChevronRight, FileIcon, FolderIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { createContext, memo, useContext } from "react";
import { sep, join } from "path-browserify";
import bytes from "bytes";
import { TorrentsFiles as TorrentFile } from "@/client/types.gen";

interface FileInfo {
  status: "downloading" | "seeding" | "paused" | "queued";
  progress: number;
  size: number;
  priority?: TorrentFile["priority"];
  index?: number;
}

interface Node {
  id: string;
  name: string;
  children?: Node[];
  fileInfo?: FileInfo;
}

export const priorityMap = {
  0: "Do not download",
  1: "Normal priority",
  6: "High priority",
  7: "Maximal priority",
} satisfies Record<NonNullable<TorrentFile["priority"]>, string>;

function buildTree(
  fileList: Array<{ path: string; fileInfo: FileInfo }>,
  idGenerator: (filePath: string) => string = (filePath) => filePath,
): Node {
  const tree: Node = { id: "ROOT", name: "ROOT", children: [] };

  for (const { path: filePath, fileInfo } of fileList) {
    const parts = filePath.split(sep);
    let currentNode = tree;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const currentPath = join(...parts.slice(0, i + 1));
      let found = false;

      if (!currentNode.children) {
        currentNode.children = [];
      }

      for (const child of currentNode.children) {
        if (child.name === part) {
          currentNode = child;
          found = true;
          break;
        }
      }

      if (!found) {
        const newNode: Node = {
          id: idGenerator(currentPath),
          name: part,
        };

        if (i === parts.length - 1) {
          newNode.fileInfo = fileInfo;
        } else {
          newNode.children = [];
        }

        currentNode.children?.push(newNode);
        currentNode = newNode;
      }
    }
  }

  return tree;
}

const formatSize = (b: number) => {
  return bytes(b, {
    unitSeparator: " ",
  });
};

type HandlePriorityChange = (
  priority: keyof typeof priorityMap,
  fileIndex: number,
) => Promise<void> | void;
const PriorityChangeContext = createContext<undefined | HandlePriorityChange>(
  undefined,
);
const useHandlePriorityChange = () => useContext(PriorityChangeContext);

export const TorrentFilesTree = memo(function TorrentFilesTree({
  files,
  handlePriorityChange,
}: {
  files: Array<{ path: string; fileInfo: FileInfo }>;
  handlePriorityChange: HandlePriorityChange;
}) {
  const rootNode = buildTree(files);

  const collection = createTreeCollection<Node>({
    nodeToValue: (node) => node.id,
    nodeToString: (node) => node.name,
    rootNode,
  });

  return (
    <PriorityChangeContext.Provider value={handlePriorityChange}>
      <TreeView.Root collection={collection}>
        <TreeView.Label className="sr-only">Torrent Files Tree</TreeView.Label>

        <TreeView.Tree>
          {collection.rootNode.children?.map((node, index) => (
            <TreeNode key={node.id} node={node} indexPath={[index]} />
          ))}
        </TreeView.Tree>
      </TreeView.Root>
    </PriorityChangeContext.Provider>
  );
});

const TreeNode = (props: TreeView.NodeProviderProps<Node>) => {
  const { node, indexPath } = props;

  const priority = node.fileInfo?.priority;
  const handlePriorityChange = useHandlePriorityChange();

  return (
    <TreeView.NodeProvider key={node.id} node={node} indexPath={indexPath}>
      {node.children ? (
        <TreeView.Branch>
          <TreeView.BranchControl className="flex items-center">
            <Button variant="ghost" size="sm" asChild>
              <TreeView.BranchText className="flex items-center gap-1 w-full text-left justify-start h-auto py-2 hover:bg-secondary/40">
                <FolderIcon />{" "}
                <span className="break-all shrink-1 whitespace-normal">
                  {node.name}
                </span>
                <TreeView.BranchIndicator className="group ml-auto">
                  <ChevronDown
                    className="group-[[data-state=closed]]:hidden"
                    size={16}
                  />
                  <ChevronRight
                    className="group-[[data-state=open]]:hidden"
                    size={16}
                  />
                </TreeView.BranchIndicator>
              </TreeView.BranchText>
            </Button>
          </TreeView.BranchControl>

          <TreeView.BranchContent className="pl-4">
            <TreeView.BranchIndentGuide />
            {node.children.map((child, index) => (
              <TreeNode
                key={child.id}
                node={child}
                indexPath={[...indexPath, index]}
              />
            ))}
          </TreeView.BranchContent>
        </TreeView.Branch>
      ) : (
        <TreeView.Item>
          <Button variant="ghost" size="sm" asChild>
            <TreeView.ItemText className="flex flex-col md:flex-row md:items-center items-stretch gap-2 w-full justify-start h-auto py-2 hover:bg-secondary/40">
              <div className="flex items-center gap-[inherit]">
                <FileIcon />
                <span className="break-all shrink-1 whitespace-normal">
                  {node.name}
                </span>
              </div>

              {node.fileInfo && (
                <div className="flex flex-col md:flex-row md:items-center gap-[inherit] md:ml-auto">
                  {priority !== undefined && (
                    // select component to change file priority
                    <Select
                      value={String(priority)}
                      onValueChange={(v) => {
                        const value = Number(v) as typeof priority;

                        if (node.fileInfo?.index === undefined) return;

                        handlePriorityChange?.(value, node.fileInfo.index);
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
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
                  )}

                  <Badge
                    variant={
                      node.fileInfo.status === "downloading"
                        ? "default"
                        : node.fileInfo.status === "seeding"
                          ? "outline"
                          : "secondary"
                    }
                  >
                    {node.fileInfo.status}
                  </Badge>
                  <div className="flex items-center gap-2 min-w-[150px]">
                    <Progress
                      value={node.fileInfo.progress}
                      className="w-full"
                    />
                    <span className="text-xs whitespace-nowrap">
                      {node.fileInfo.progress.toFixed(1)}%
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatSize(node.fileInfo.size)}
                  </span>
                </div>
              )}
            </TreeView.ItemText>
          </Button>
        </TreeView.Item>
      )}
    </TreeView.NodeProvider>
  );
};
