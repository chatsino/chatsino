import { Grid, List, Typography } from "antd";
import { ChatMessageGenerator, toUniversalVh } from "helpers";
import { useChatAutoscroll } from "hooks";
import { useMemo, useState } from "react";
import key from "weak-key";
import { ChatInput } from "./ChatInput";
import { ChatMessageGroup } from "./ChatMessageGroup";
import { groupMessages } from "./group-messages";

export function ChatMessageList({
  id,
  messages,
  onSendMessage,
}: {
  id: string;
  messages: ChatMessage[];
  onSendMessage: (message: ChatMessage) => unknown;
}) {
  const [raised, setRaised] = useState(false);
  const { sm } = Grid.useBreakpoint();
  const onMobile = !sm;
  const groupedMessages = useMemo(() => groupMessages(messages), [messages]);

  useChatAutoscroll(id, messages);

  return (
    <List
      id={id}
      dataSource={groupedMessages}
      bordered={true}
      itemLayout="vertical"
      renderItem={(item) => (
        <ChatMessageGroup key={key(item)} messageGroup={item} />
      )}
      style={{
        transition: "height 0.2s ease-in-out",
        height: raised ? toUniversalVh(onMobile ? 30 : 50) : toUniversalVh(85),
        overflow: "auto",
      }}
      header={
        <div>
          <Typography.Title level={5}>#room</Typography.Title>
        </div>
      }
      footer={
        <ChatInput
          onDrawerOpen={() => setRaised(true)}
          onDrawerClose={() => setRaised(false)}
          onSend={(message) =>
            onSendMessage(
              ChatMessageGenerator.generateChatMessage({
                author: {
                  id: 1,
                  username: "Bob Johnson",
                },
                content: message,
              })
            )
          }
        />
      }
    />
  );
}
