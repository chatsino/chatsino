export function formatMessageTimestamp(message: ChatMessage) {
  const messageCreatedDate = new Date(message.createdAt);
  const formattedMessageCreatedDate = new Intl.DateTimeFormat("en-us").format(
    messageCreatedDate
  );
  const messageCreatedTime = new Intl.DateTimeFormat("en-us", {
    timeStyle: "short",
  }).format(messageCreatedDate);

  const messageUpdatedDate = new Date(message.updatedAt);
  const formattedMessageUpdatedDate = new Intl.DateTimeFormat("en-us").format(
    messageUpdatedDate
  );
  const messageUpdatedTime = new Intl.DateTimeFormat("en-us", {
    timeStyle: "short",
  }).format(messageUpdatedDate);

  const currentDate = new Date();
  const formattedCurrentDate = new Intl.DateTimeFormat("en-us").format(
    currentDate
  );

  const milisecondsInADay = 1000 * 60 * 60 * 24;
  const yesterdayDate = new Date(currentDate.getTime() - milisecondsInADay);
  const formattedYesterdaysDate = new Intl.DateTimeFormat("en-us").format(
    yesterdayDate
  );

  const isToday = formattedMessageCreatedDate === formattedCurrentDate;
  const wasYesterday = formattedMessageCreatedDate === formattedYesterdaysDate;

  const wasUpdated = message.updatedAt !== message.createdAt;
  const updatedToday =
    wasUpdated && formattedMessageUpdatedDate === formattedCurrentDate;
  const updatedYesterday =
    wasUpdated && formattedMessageUpdatedDate === formattedYesterdaysDate;

  let updateText = wasUpdated
    ? ` (Updated ${formattedMessageUpdatedDate} at ${messageUpdatedTime})`
    : "";

  if (updatedToday) {
    updateText = ` (Updated today at ${messageUpdatedTime})`;
  } else if (updatedYesterday) {
    updateText = ` (Updated yesterday at ${messageUpdatedTime})`;
  }

  if (isToday) {
    return `Today at ${messageCreatedTime}${updateText}`;
  } else if (wasYesterday) {
    return `Yesterday at ${messageCreatedTime}${updateText}`;
  } else {
    return `${formattedMessageCreatedDate} at ${messageCreatedTime}${updateText}`;
  }
}
