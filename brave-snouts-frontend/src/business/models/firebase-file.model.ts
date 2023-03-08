
export interface FirebaseFile {
  name: string;
  type: string;

  path: string; // auction-bucket/auctionId
  fullPath?: string; // auction-bucket/auctionId/imageName
  tempPath?: string; // temp-bucket/auctionId/imageName

  url: string;
  thumb: string;
  tempUrl?: string;
}
