import { useEffect, useRef } from "react";

export const DISTANCE_AT_WHICH_AUTOSCROLL_IS_DISABLED = 250;

export function getRoomContainer(id: string) {
  return document.querySelector(`#__${id} > .ant-spin-nested-loading`);
}

export function scrollToBottom(id: string) {
  const roomContainer = getRoomContainer(id);

  if (roomContainer) {
    roomContainer.scrollTop = roomContainer.scrollHeight;
    return true;
  }

  return false;
}

export function useRoomAutoscroll(id: string, messages: unknown[]) {
  const initiallyScrolledDown = useRef(false);

  // When messages first load, scroll to the bottom of the container.
  useEffect(() => {
    if (!initiallyScrolledDown.current && messages.length > 0) {
      const scrolledToBottom = scrollToBottom(id);

      if (scrolledToBottom) {
        initiallyScrolledDown.current = true;
      }
    }
  }, [id, messages.length]);

  // When more messages come in, scroll to the bottom of the container
  // only if the user hasn't manually scrolled up.
  useEffect(() => {
    if (initiallyScrolledDown.current) {
      const chatContainer = getRoomContainer(id);

      if (chatContainer) {
        const scrolledDistance =
          chatContainer.scrollTop + chatContainer.clientHeight;
        const isNearBottom =
          chatContainer.scrollHeight - scrolledDistance <=
          DISTANCE_AT_WHICH_AUTOSCROLL_IS_DISABLED;

        if (isNearBottom) {
          scrollToBottom(id);
        }
      }
    }
  }, [id, messages.length]);
}
