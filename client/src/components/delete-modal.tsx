import { useState } from "react";
import { APP_MESSAGES, getRandomMessage } from "../constants/messages";

interface DeleteModalProps {
  isDeleting: boolean;
  onConfirm: (password: string) => Promise<void>;
  onCancel: () => void;
}

export function DeleteModal({
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteModalProps) {
  const [password, setPassword] = useState("");

  const handleConfirm = async () => {
    if (!password) return;
    try {
      await onConfirm(password);
      alert(getRandomMessage(APP_MESSAGES.DELETE_SUCCESS));
      setPassword("");
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail;
      alert(detail || "삭제에 실패했습니다. 비밀번호를 확인하세요.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
      <div className="bg-[#1b1b1b] w-full max-w-md rounded-[32px] p-8 border border-[#39ff14]/20 shadow-[0_0_50px_rgba(57,255,20,0.1)]">
        <h2 className="text-2xl font-bold mb-2">정말 삭제할까요?</h2>
        <p className="text-gray-400 mb-6 text-sm">
          작성 시 입력했던 비밀번호를 확인합니다.
        </p>

        <input
          type="password"
          className="w-full bg-black border border-white/10 rounded-full px-6 py-4 text-white focus:outline-none focus:border-[#39ff14] mb-6"
          placeholder="비밀번호 입력"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex gap-3">
          <button
            type="button"
            className="flex-1 bg-white/5 hover:bg-white/10 text-white py-4 rounded-full font-bold transition-all"
            onClick={onCancel}
          >
            취소
          </button>
          <button
            type="button"
            className="flex-1 bg-[#39ff14] text-black py-4 rounded-full font-bold hover:bg-[#32e011] transition-all disabled:opacity-50"
            onClick={handleConfirm}
            disabled={isDeleting || !password}
          >
            {isDeleting ? "삭제 중..." : "확인"}
          </button>
        </div>
      </div>
    </div>
  );
}
