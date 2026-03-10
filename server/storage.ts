export interface IStorage {
  // Empty storage interface
}

export class MemStorage implements IStorage {
  // Empty memory storage
}

export const storage = new MemStorage();
