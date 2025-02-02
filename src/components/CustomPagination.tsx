import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import * as pagination from "@zag-js/pagination";
import { normalizeProps, useMachine } from "@zag-js/react";
import { FunctionComponent, useId } from "react";

export const CustomPagination: FunctionComponent<{
  count: number;
  pageSize: number;
  page: number;
  searchParam: string;
}> = ({ count, pageSize, page, searchParam }) => {
  const id = useId();

  const context: pagination.Context = {
    id,
    count,
    pageSize,
    page,
  };

  const [state, send] = useMachine(pagination.machine(context), {
    // needs to be passed twice to be reactive
    context,
  });

  const paginationApi = pagination.connect(state, send, normalizeProps);

  return (
    <Pagination>
      <PaginationContent className="">
        <PaginationItem>
          <PaginationPrevious
            search={
              {
                [searchParam]: paginationApi.previousPage ?? undefined,
              } as any
            }
          />
        </PaginationItem>

        {paginationApi.pages.map((page, i) => {
          if (page.type === "page") {
            return (
              <PaginationItem key={`page-${page.value}`}>
                <PaginationLink
                  search={
                    {
                      p: page.value,
                    } as any
                  }
                  isActive={page.value === paginationApi.page}
                >
                  {page.value}
                </PaginationLink>
              </PaginationItem>
            );
          }

          return (
            <PaginationItem key={`ellipsis-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          );
        })}

        <PaginationItem>
          <PaginationNext
            search={
              {
                p: paginationApi.nextPage ?? undefined,
              } as any
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};
