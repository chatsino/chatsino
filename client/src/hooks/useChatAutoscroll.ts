import { useEffect, useRef } from "react";

export const DISTANCE_AT_WHICH_AUTOSCROLL_IS_DISABLED = 200;

export function getChatContainer() {
  return document.querySelector("#chat > .ant-spin-nested-loading");
}

export function scrollToBottom() {
  const chatContainer = getChatContainer();

  if (chatContainer) {
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return true;
  }

  return false;
}

export function useChatAutoscroll(messages: unknown[]) {
  const initiallyScrolledDown = useRef(false);

  // When messages first load, scroll to the bottom of the container.
  useEffect(() => {
    if (!initiallyScrolledDown.current && messages.length > 0) {
      const scrolledToBottom = scrollToBottom();

      if (scrolledToBottom) {
        initiallyScrolledDown.current = true;
      }
    }
  }, [messages]);

  // When more messages come in, scroll to the bottom of the container
  // only if the user hasn't manually scrolled up.
  useEffect(() => {
    if (initiallyScrolledDown.current) {
      const chatContainer = getChatContainer();

      if (chatContainer) {
        const scrolledDistance =
          chatContainer.scrollTop + chatContainer.clientHeight;
        const isNearBottom =
          chatContainer.scrollHeight - scrolledDistance <=
          DISTANCE_AT_WHICH_AUTOSCROLL_IS_DISABLED;

        if (isNearBottom) {
          scrollToBottom();
        }
      }
    }
  }, [messages.length]);
}
