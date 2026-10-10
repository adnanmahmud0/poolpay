export interface IStorageProvider {
  uploadFile(file: Express.Multer.File, folder?: string): Promise<string>;
  deleteFile(url: string): Promise<void>;
}
