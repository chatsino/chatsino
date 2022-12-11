import React, { useMemo, useRef, useState } from "react";
import debounce from "lodash.debounce";

export const CHAT_SEARCH_DEBOUNCE_RATE = 1000;

export function useChatSearch(chatroom: ChatroomData) {
  const [query, setQuery] = useState("");
  const debouncedChangeQuery = useRef(
    debounce(
      (event: React.ChangeEvent<HTMLInputElement>) =>
        setQuery(event.target.value),
      CHAT_SEARCH_DEBOUNCE_RATE
    )
  );
  const results = useMemo(
    () =>
      chatroom.messages.filter((message) =>
        message.content.toLowerCase().includes(query.toLowerCase())
      ),
    [query, chatroom.messages]
  );

  return {
    query,
    results,
    isSearching: query.length > 0,
    noResults: results.length === 0,
    setQuery,
    clearQuery: () =>
      debouncedChangeQuery.current({
        target: { value: "" },
      } as React.ChangeEvent<HTMLInputElement>),
  };
  //
}
