export interface InspectionSummary {
  cookies: number;
  trackers: number;
}

export interface InspectionResponse {
  status: string;
  summary: InspectionSummary;
  groups?: any[];
  message?: string;
  msg?: string
}

export interface BaselineResult {
  website: string;
  cookies: number;
  trackers: number;
}

