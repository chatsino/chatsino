import { useLayoutEffect, useState } from "react";

export function useRoomHeaderHeight(id: string) {
  const [height, setHeight] = useState(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const roomHeader = document.getElementById(
      `RoomHeader#${id}`
    )?.parentElement;

    if (roomHeader) {
      const roomHeaderHeight = parseInt(getComputedStyle(roomHeader).height);

      if (roomHeaderHeight !== height) {
        setHeight(roomHeaderHeight);
      }
    }
  });

  return height;
}
