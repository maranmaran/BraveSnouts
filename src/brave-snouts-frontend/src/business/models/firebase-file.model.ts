
export interface FirebaseFile {
  name: string;
  type: 'image' | 'video';

  original: FirebaseFileAccess;
  thumbnail: FirebaseFileAccess;
  compressed: FirebaseFileAccess;
}

export interface FirebaseFileAccess {
  path: string;
  fUrl: string; // firebase url
  gUrl: string; // gcloud url
}