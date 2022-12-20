import { useLayoutEffect, useState } from "react";

export function useChatroomHeaderHeight(id: number) {
  const [height, setHeight] = useState(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const chatroomHeader = document.getElementById(
      `ChatroomHeader#${id}`
    )?.parentElement;

    if (chatroomHeader) {
      const chatroomHeaderHeight = parseInt(
        getComputedStyle(chatroomHeader).height
      );

      if (chatroomHeaderHeight !== height) {
        setHeight(chatroomHeaderHeight);
      }
    }
  });

  return height;
}
