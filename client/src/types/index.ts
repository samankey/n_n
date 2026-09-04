export interface PostRecord {
  id?: number;
  title: string;
  content: string;
  password?: string; // 작성할 때만 사용
  authorId?: string; // 서버가 발급한 표시용 익명 ID
}
