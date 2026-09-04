import { useState } from "react";
import { usePosts } from "../hooks/use-posts";
import { DeleteModal } from "./delete-modal";
import { PostCard } from "./post-card";
import { PostForm } from "./post-form";

export function MainContent() {
  const { list, isFetching, isAdding, isRemoving, error, addPost, removePost } =
    usePosts();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetId, setTargetId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (id: number) => {
    setTargetId(id);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async (password: string) => {
    if (!targetId) return;
    setIsDeleting(true);
    try {
      await removePost({ id: targetId, password });
    } finally {
      setIsDeleting(false);
      setIsModalOpen(false);
      setTargetId(null);
    }
  };

  const handleCancelDelete = () => {
    setIsModalOpen(false);
    setTargetId(null);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans pb-32">
      {/* Header */}
      <header className="sticky top-0 flex items-center justify-center mb-12 py-4 bg-[#121212]">
        <h1 className="text-xl font-bold text-[#39ff14]">n_n</h1>
      </header>

      <div className="max-w-3xl mx-auto px-6 flex flex-col gap-16">
        {/* Post Form */}
        <PostForm isAdding={isAdding} onSubmit={addPost} />

        {/* Error Banner */}
        {error && (
          <div className="p-5 bg-red-900/20 border border-red-500/30 text-red-400 rounded-3xl text-sm flex items-center gap-3">
            <span>⚠️</span> {error.message}
          </div>
        )}

        {/* Feed */}
        <div className="flex flex-col gap-8">
          {list.length === 0 && !isFetching && (
            <p className="text-center py-20 text-[#c6c6c7] font-medium">
              아직 숲이 고요합니다. 첫 번째 외침을 남겨보세요!
            </p>
          )}

          {list.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isRemoving={isRemoving}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      </div>

      {/* Delete Modal */}
      {isModalOpen && (
        <DeleteModal
          isDeleting={isDeleting}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </div>
  );
}
