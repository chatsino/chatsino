import * as config from "config";

export const makeFileUrl = (resource: string) =>
  [config.FILE_UPLOAD_URL, resource].join("/");
