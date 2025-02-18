import { TreeView, createTreeCollection } from "@ark-ui/react/tree-view";
import { ChevronDown, ChevronRight, FileIcon, FolderIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { memo } from "react";
import { sep, join } from "path-browserify";
import bytes from "bytes";

interface FileInfo {
  status: "downloading" | "seeding" | "paused" | "queued";
  progress: number;
  size: number;
}

interface Node {
  id: string;
  name: string;
  children?: Node[];
  fileInfo?: FileInfo;
}

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

export const TorrentFilesTree = memo(function TorrentFilesTree({
  files,
}: {
  files: Array<{ path: string; fileInfo: FileInfo }>;
}) {
  const rootNode = buildTree(files);

  const collection = createTreeCollection<Node>({
    nodeToValue: (node) => node.id,
    nodeToString: (node) => node.name,
    rootNode,
  });

  return (
    <TreeView.Root collection={collection}>
      <TreeView.Label className="sr-only">Torrent Files Tree</TreeView.Label>

      <TreeView.Tree>
        {collection.rootNode.children?.map((node, index) => (
          <TreeNode key={node.id} node={node} indexPath={[index]} />
        ))}
      </TreeView.Tree>
    </TreeView.Root>
  );
});

const TreeNode = (props: TreeView.NodeProviderProps<Node>) => {
  const { node, indexPath } = props;

  return (
    <TreeView.NodeProvider key={node.id} node={node} indexPath={indexPath}>
      {node.children ? (
        <TreeView.Branch>
          <TreeView.BranchControl className="flex items-center">
            <Button variant="ghost" size="sm" asChild>
              <TreeView.BranchText className="flex items-center gap-1 w-full text-left justify-start h-auto py-2">
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
            <TreeView.ItemText className="flex items-center gap-2 w-full justify-start h-auto py-2">
              <FileIcon />
              <span className="break-all shrink-1 whitespace-normal">
                {node.name}
              </span>
              {node.fileInfo && (
                <>
                  <Badge
                    variant={
                      node.fileInfo.status === "downloading"
                        ? "default"
                        : node.fileInfo.status === "seeding"
                          ? "outline"
                          : "secondary"
                    }
                    className="ml-auto"
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
                </>
              )}
            </TreeView.ItemText>
          </Button>
        </TreeView.Item>
      )}
    </TreeView.NodeProvider>
  );
};
