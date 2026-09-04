import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPost, deletePost, getPosts } from "../api/issue-service";
import type { PostRecord } from "../types";

export function usePosts() {
  const queryClient = useQueryClient();

  // 데이터 가져오기
  const {
    data: list = [],
    isLoading: isFetching,
    error,
  } = useQuery({
    queryKey: ["posts"],
    queryFn: getPosts,
    // 유저가 다시 창을 봤을 때 신선한 데이터를 가져오도록 설정
    refetchOnWindowFocus: true,
  });

  // 포스팅하기
  const addMutation = useMutation({
    mutationFn: createPost,
    onMutate: async (newPost: PostRecord) => {
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      const previousPosts = queryClient.getQueryData(["posts"]);
      // 낙관적 업데이트
      queryClient.setQueryData(["posts"], (old: PostRecord[] = []) => [
        newPost,
        ...old,
      ]);
      return { previousPosts };
    },
    onError: (_err, _newPost, context) => {
      queryClient.setQueryData(["posts"], context?.previousPosts);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  // 삭제하기
  const removeMutation = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      deletePost(id, password),
    onSuccess: (_, { id }: { id: number; password: string }) => {
      queryClient.setQueryData(["posts"], (old: PostRecord[]) =>
        old.filter((post) => post.id !== id),
      );
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  return {
    list,
    isFetching, // 목록 로딩 상태
    isAdding: addMutation.isPending, // 글 쓰기 로딩 상태
    isRemoving: removeMutation.isPending, // 글 삭제 로딩 상태
    error,
    addPost: addMutation.mutateAsync,
    removePost: removeMutation.mutateAsync,
  };
}
