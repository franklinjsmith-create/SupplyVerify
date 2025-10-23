// Storage interface for USDA verification tool
// This application uses in-memory storage for session data only
// All verification data is fetched real-time from USDA OID

export interface IStorage {
  // This application doesn't require persistent storage
  // All data is fetched from external USDA API
}

export class MemStorage implements IStorage {
  constructor() {
    // No storage needed for this application
  }
}

export const storage = new MemStorage();
