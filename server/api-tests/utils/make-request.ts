import axiosLib, { AxiosError } from "axios";
import { readFileSync } from "fs";
import { Agent } from "https";
import path from "path";

interface ServerResponse<T> {
  error: boolean;
  result: "OK" | "Error";
  message: string;
  data: T;
}

export const axios = axiosLib.create({
  baseURL: "https://localhost:3001",
  timeout: 5000,
  httpsAgent: new Agent({
    rejectUnauthorized: false,
    cert: readFileSync(
      path.join(__dirname, "..", "..", ".ssh", "localhost.pem")
    ),
  }),
});

export async function makeRequest<T>(
  method: "get" | "post",
  route: string,
  body?: Record<string, string>
): Promise<T> {
  try {
    const response = await axios[method](route, body);
    const { data } = response.data as ServerResponse<T>;

    return data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.response?.data?.message);
    }

    throw error;
  }
}
