import axiosLib from "axios";
import { ServerResponse } from "shared";
import * as config from "config";

export const axios = axiosLib.create({
  baseURL: config.API_BASE_URL,
  timeout: config.API_TIMEOUT,
});

export async function makeHttpRequest<T>(
  method: "get" | "post" | "patch" | "delete",
  route: string,
  body?: Record<string, unknown>
): Promise<T> {
  const response = await axios[method](route, body, {});
  const data = response.data as ServerResponse<T>;

  if (!data.error && data.result === "OK") {
    return data.data;
  } else {
    throw new Error(data.message);
  }
}

export async function makeFileUploadRequest(route: string, file: FormData) {
  const response = await axios.post(route, file, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  const data = response.data as ServerResponse<unknown>;

  if (!data.error && data.result === "OK") {
    return data.data;
  } else {
    throw new Error(data.message);
  }
}
