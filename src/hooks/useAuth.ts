import { appVersionGet, authLoginPost, AuthLoginPostData } from "@/client";
import { queryClient } from "@/lib/queryClient";
import { router } from "@/router";
import {
  useMutation,
  useQuery,
  queryOptions,
  type QueryClient,
} from "@tanstack/react-query";

const checkAuthOptions = queryOptions({
  queryKey: ["checkAuth"],
  // there's no need to refetch this query on mount considering it's a login check
  // if it fails, we're not logged in
  refetchOnMount: false,
  queryFn: async () => {
    // we can't get the app vesion without being logged in so that's a good way to check if we're logged in
    try {
      await appVersionGet();
      return true;
    } catch (error) {
      return false;
    }
  },
  retry: false,
});

export function setIsAuth(queryClient: QueryClient, v: boolean) {
  queryClient.setQueryData(checkAuthOptions.queryKey, v);
}

export const checkAuth = async () => {
  const isAuth = await queryClient.ensureQueryData(checkAuthOptions);

  return isAuth;
};

export const useAuth = () => {
  const checkAuth = useQuery(checkAuthOptions, queryClient);
  const isAuth = checkAuth.data === true;

  const login = useMutation(
    {
      mutationFn: async (props: AuthLoginPostData["body"]) => {
        const response = await authLoginPost({
          body: {
            password: props.password,
            username: props.username,
          },
        });

        const {
          data,
          response: { status },
        } = response;

        return { data, status };
      },
      async onSuccess() {
        setIsAuth(queryClient, true);

        // makes sure the cache is updated before navigating
        setTimeout(
          () =>
            router.navigate({
              to: "/",
            }),
          0,
        );
      },
    },
    queryClient,
  );

  const isAuthReady = () =>
    !checkAuth.isPending; /* checkAuth.data !== undefined */

  return {
    isAuth,
    isAuthReady,
    login,
    setIsAuth: (v: boolean) => setIsAuth(queryClient, v),
  };
};
