export type ChatRole = "user" | "assistant";

export type ChatMessageView = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
};

export type SendMessageResult = {
  message: ChatMessageView;
  model: string;
};
