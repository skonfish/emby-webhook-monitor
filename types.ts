export interface PlaybackRecord {
  id: string;
  timestamp: number; // Unix timestamp
  username: string;
  ip: string;
  location: string;
  client: string;
  device: string;
  mediaTitle: string;
  mediaType: string;
  season?: number;
  episode?: number;
}

// Emby Webhook Payload Interface (Simplified for relevant fields)
export interface EmbyWebhookPayload {
  Event: string;
  User?: {
    Name: string;
    Id: string;
  };
  Session?: {
    RemoteEndPoint: string;
    Client: string;
    DeviceName: string;
  };
  Item?: {
    Name: string;
    OriginalTitle?: string;
    Type: string;
    IndexNumber?: number; // Episode number
    ParentIndexNumber?: number; // Season number
    SeriesName?: string;
  };
  Server?: {
    Name: string;
  };
  Title?: string; // Fallback
}

export interface FilterState {
  username: string;
  mediaTitle: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}
