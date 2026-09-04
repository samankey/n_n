import type { PostRecord } from "../types";

interface PostCardProps {
  post: PostRecord;
  isRemoving: boolean;
  onDelete: (id: number) => void;
}

export function PostCard({ post, isRemoving, onDelete }: PostCardProps) {
  return (
    <div className="border-t border-white/10 py-8 flex flex-col gap-6 transition-all">
      <div className="flex flex-col gap-4">
        <h3 className="text-lg text-[#e2e2e2] font-medium">{post.title}</h3>
        <p className="text-[#badab0] leading-relaxed whitespace-pre-wrap text-base">
          {post.content}
        </p>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="bg-black/40 border border-white/5 text-[#c6c6c7] px-3 py-1.5 rounded-full text-xs font-mono">
            no_name_{post.authorId || post.id}
          </span>
        </div>
        <button
          type="button"
          className="text-gray-500 hover:text-red-400 px-2 py-1 transition-colors text-sm font-bold tracking-wide"
          disabled={isRemoving}
          onClick={() => post.id && onDelete(post.id)}
        >
          {isRemoving ? "삭제 중" : "삭제"}
        </button>
      </div>
    </div>
  );
}
