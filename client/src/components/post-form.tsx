import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { APP_MESSAGES, getRandomMessage } from "../constants/messages";
import type { PostRecord } from "../types";

const postSchema = z.object({
  title: z
    .string()
    .min(2, "제목은 최소 2글자 이상이어야 합니다.")
    .max(20, "제목은 20글자 이내로 작성해 주세요."),

  content: z
    .string()
    .min(5, "내용을 더 작성해주세요. (최소 5글자)")
    .max(2000, "내용이 너무 길어요. (최대 2000글자)"),

  password: z
    .string()
    .min(4, "비밀번호는 4글자 이상이어야 합니다.")
    .max(20, "비밀번호는 20글자 이내로 설정해 주세요."),
});

type PostFormData = z.infer<typeof postSchema>;

interface PostFormProps {
  isAdding: boolean;
  onSubmit: (post: PostRecord) => Promise<void>;
}

export function PostForm({ isAdding, onSubmit }: PostFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
  });

  const handleFormSubmit = async (data: PostFormData) => {
    try {
      await onSubmit(data); // 부모로부터 받은 addPost 실행
      alert(getRandomMessage(APP_MESSAGES.CREATE));
      reset(); // 폼 초기화
    } catch (_err) {
      alert("대나무숲에 외치기가 실패했습니다.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="bg-[#1b1b1b] rounded-[32px] border border-white/5 p-8 flex flex-col gap-6 shadow-2xl"
    >
      <div className="flex flex-col gap-1">
        <input
          {...register("title")}
          className={`w-full bg-black border ${errors.title ? "border-red-500" : "border-white/10"} rounded-full px-6 py-4 text-white placeholder-[#c6c6c7] focus:outline-none focus:border-[#39ff14]/50 transition-all text-base`}
          placeholder="제목"
        />
        {errors.title && (
          <span className="text-red-500 text-xs ml-4">
            {errors.title.message}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <textarea
          {...register("content")}
          className={`w-full h-40 bg-transparent border ${errors.content ? "border-red-500" : "border-white/5"} rounded-[32px] px-6 py-6 text-white placeholder-[#c6c6c7] focus:outline-none focus:border-[#39ff14]/50 transition-all resize-none text-base`}
          placeholder="내용을 입력하세요"
        />
        {errors.content && (
          <span className="text-red-500 text-xs ml-4">
            {errors.content.message}
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-start">
        <div className="flex-1 flex flex-col gap-1">
          <input
            type="password"
            {...register("password")}
            className={`w-full bg-black border ${errors.password ? "border-red-500" : "border-white/10"} rounded-full px-6 py-4 text-white placeholder-[#c6c6c7] focus:outline-none focus:border-[#39ff14]/50 transition-all text-base`}
            placeholder="삭제 비밀번호"
          />
          {errors.password && (
            <span className="text-red-500 text-xs ml-4">
              {errors.password.message}
            </span>
          )}
        </div>

        <button
          type="submit"
          className="w-full sm:w-auto bg-[#39ff14] text-black px-10 py-4 rounded-full font-bold hover:bg-[#32e011] active:scale-95 disabled:bg-[#39ff14]/30 disabled:text-gray-500 transition-all whitespace-nowrap text-base h-[58px]"
          disabled={isAdding}
        >
          {isAdding ? "게시 중..." : "게시하기"}
        </button>
      </div>
    </form>
  );
}
