export const fromDateString = (dateString: string) =>
  new Intl.DateTimeFormat("en-us", {
    timeStyle: "medium",
    dateStyle: "medium",
  }).format(new Date(dateString));
