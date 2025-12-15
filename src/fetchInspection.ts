import { DEFAULT_API_URL } from "./config";
import { InspectionResponse } from "./types";

export async function fetchInspection(
  url: string,
  options?: {
    device?: string;
    force?: boolean;
    location?: string;
    apiUrl?: string;
  }
): Promise<InspectionResponse> {
  const {
    device = "mobile",
    force = false,
    location = "us-oh",
    apiUrl = process.env.BLACKLIGHT_API_URL ?? DEFAULT_API_URL,
  } = options ?? {};

  const payload = {
    inUrl: url,
    device,
    force,
    location,
  };

  const res = await fetch(apiUrl, {
    method: "POST",

    // Used text/plain to match how frontend call express server api
    headers: {
      "Content-Type": "text/plain",
    },

    // Body remains a stringified JSON object
    body: JSON.stringify(payload),
  });

  const text = await res.text();

  let data: any;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error(
      `Blacklight returned non-JSON response (${res.status}): ${text}`
    );
  }

  if (!res.ok || data.status !== "success") {
    throw new Error(
      data?.errors?.[0]?.message ?? 
      data?.message ??
      `Blacklight inspection failed (${res.status}) for ${url}`
    );
  }

  return data;
}