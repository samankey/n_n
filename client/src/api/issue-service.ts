import axios from "axios";
import type { PostRecord } from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

/**
 * 익명 게시글 생성
 */
export const createPost = async (post: PostRecord) => {
  const response = await axios.post(`${API_BASE_URL}/post_issue`, {
    title: post.title,
    content: post.content,
    password: post.password,
  });
  return response.data;
};

/**
 * 게시글 목록 읽기
 */
export const getPosts = async (): Promise<PostRecord[]> => {
  const response = await axios.get(`${API_BASE_URL}/posts`);
  return response.data.map(
    (issue: {
      id: number;
      title: string;
      content: string;
      author_id: string;
    }) => ({
      id: issue.id,
      title: issue.title,
      content: issue.content,
      authorId: issue.author_id,
    }),
  );
};

/**
 * 게시글 삭제
 */
export const deletePost = async (issueNumber: number, password: string) => {
  const res = await axios.post(`${API_BASE_URL}/delete_issue/${issueNumber}`, {
    password,
  });

  return res.data;
};
