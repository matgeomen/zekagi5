import { users, type User, type InsertUser } from "@shared/schema";
import { EnhancedMemorySystem, Memory, MemoryCluster } from "../client/src/lib/EnhancedMemorySystem";
import { 
  NetworkNode, 
  Relation, 
  TrainingPair 
} from "../client/src/lib/NeuralNetworkUtils";

// Modify the interface with CRUD methods for our neural network application
export interface IStorage {
  // User CRUD operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Neural network operations
  saveUserNetworks(networks: (NetworkNode | null)[][][]): Promise<void>;
  getUserNetworks(): Promise<(NetworkNode | null)[][][] | null>;
  saveSystemNetworks(networks: (NetworkNode | null)[][][]): Promise<void>;
  getSystemNetworks(): Promise<(NetworkNode | null)[][][] | null>;
  
  // Relations operations
  saveRelations(relations: Relation[]): Promise<void>;
  getRelations(): Promise<Relation[] | null>;
  saveBidirectionalRelations(relations: Relation[]): Promise<void>;
  getBidirectionalRelations(): Promise<Relation[] | null>;
  
  // Memory system operations
  saveMemories(shortTerm: Memory[], longTerm: Memory[], clusters: MemoryCluster[]): Promise<void>;
  getMemories(): Promise<{ shortTerm: Memory[]; longTerm: Memory[]; clusters: MemoryCluster[] } | null>;
  
  // Training history operations
  saveTrainingHistory(history: TrainingPair[]): Promise<void>;
  getTrainingHistory(): Promise<TrainingPair[] | null>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private userNetworks: (NetworkNode | null)[][][] | null = null;
  private systemNetworks: (NetworkNode | null)[][][] | null = null;
  private relations: Relation[] | null = null;
  private bidirectionalRelations: Relation[] | null = null;
  private shortTermMemories: Memory[] = [];
  private longTermMemories: Memory[] = [];
  private memoryClusters: MemoryCluster[] = [];
  private trainingHistory: TrainingPair[] = [];
  currentId: number;

  constructor() {
    this.users = new Map();
    this.currentId = 1;
  }

  // User CRUD operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Neural network operations
  async saveUserNetworks(networks: (NetworkNode | null)[][][]): Promise<void> {
    this.userNetworks = JSON.parse(JSON.stringify(networks));
  }

  async getUserNetworks(): Promise<(NetworkNode | null)[][][] | null> {
    return this.userNetworks ? JSON.parse(JSON.stringify(this.userNetworks)) : null;
  }

  async saveSystemNetworks(networks: (NetworkNode | null)[][][]): Promise<void> {
    this.systemNetworks = JSON.parse(JSON.stringify(networks));
  }

  async getSystemNetworks(): Promise<(NetworkNode | null)[][][] | null> {
    return this.systemNetworks ? JSON.parse(JSON.stringify(this.systemNetworks)) : null;
  }

  // Relations operations
  async saveRelations(relations: Relation[]): Promise<void> {
    this.relations = JSON.parse(JSON.stringify(relations));
  }

  async getRelations(): Promise<Relation[] | null> {
    return this.relations ? JSON.parse(JSON.stringify(this.relations)) : null;
  }

  async saveBidirectionalRelations(relations: Relation[]): Promise<void> {
    this.bidirectionalRelations = JSON.parse(JSON.stringify(relations));
  }

  async getBidirectionalRelations(): Promise<Relation[] | null> {
    return this.bidirectionalRelations ? JSON.parse(JSON.stringify(this.bidirectionalRelations)) : null;
  }

  // Memory system operations
  async saveMemories(shortTerm: Memory[], longTerm: Memory[], clusters: MemoryCluster[]): Promise<void> {
    this.shortTermMemories = JSON.parse(JSON.stringify(shortTerm));
    this.longTermMemories = JSON.parse(JSON.stringify(longTerm));
    this.memoryClusters = JSON.parse(JSON.stringify(clusters));
  }

  async getMemories(): Promise<{ shortTerm: Memory[]; longTerm: Memory[]; clusters: MemoryCluster[] } | null> {
    return {
      shortTerm: JSON.parse(JSON.stringify(this.shortTermMemories)),
      longTerm: JSON.parse(JSON.stringify(this.longTermMemories)),
      clusters: JSON.parse(JSON.stringify(this.memoryClusters))
    };
  }

  // Training history operations
  async saveTrainingHistory(history: TrainingPair[]): Promise<void> {
    this.trainingHistory = JSON.parse(JSON.stringify(history));
  }

  async getTrainingHistory(): Promise<TrainingPair[] | null> {
    return this.trainingHistory.length > 0 ? JSON.parse(JSON.stringify(this.trainingHistory)) : null;
  }
}

// Create and export a singleton instance
export const storage = new MemStorage();
