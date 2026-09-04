export const APP_MESSAGES = {
  CREATE: [
    "당신의 이야기가 무사히 등록되었습니다.",
    "새로운 기록이 성공적으로 추가되었습니다.",
    "남겨주신 이야기를 소중히 보관하겠습니다.",
    "기록이 완료되었습니다. 이제 목록에서 확인해보세요.",
  ],

  DELETE_SUCCESS: [
    "요청하신 기록이 깔끔하게 정리되었습니다.",
    "성공적으로 삭제되었습니다. 이제 안심하세요.",
    "데이터가 삭제되었습니다. 언제든 다시 들러주세요.",
    "기록이 완전히 제거되었습니다.",
  ],
};

export const getRandomMessage = (messages: string[]) => {
  return messages[Math.floor(Math.random() * messages.length)];
};
