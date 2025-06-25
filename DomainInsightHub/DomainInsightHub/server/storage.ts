import { 
  domains, 
  keywords, 
  prompts, 
  analyses,
  type Domain, 
  type InsertDomain,
  type Keyword,
  type InsertKeyword,
  type Prompt,
  type InsertPrompt,
  type Analysis,
  type InsertAnalysis,
  type DomainWithKeywords
} from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Domain operations
  getDomain(id: number): Promise<Domain | undefined>;
  getDomainByName(name: string): Promise<Domain | undefined>;
  createDomain(domain: InsertDomain): Promise<Domain>;
  updateDomain(id: number, updates: Partial<InsertDomain>): Promise<Domain | undefined>;
  getAllDomains(): Promise<Domain[]>;
  getDomainWithKeywords(id: number): Promise<DomainWithKeywords | undefined>;

  // Keyword operations
  getKeywordsByDomain(domainId: number): Promise<Keyword[]>;
  createKeyword(keyword: InsertKeyword): Promise<Keyword>;
  updateKeyword(id: number, value: string): Promise<Keyword | undefined>;
  deleteKeyword(id: number): Promise<boolean>;

  // Prompt operations
  getPromptsByDomain(domainId: number): Promise<Prompt[]>;
  createPrompt(prompt: InsertPrompt): Promise<Prompt>;
  getPrompt(id: number): Promise<Prompt | undefined>;

  // Analysis operations
  getAnalysesByPrompt(promptId: number): Promise<Analysis[]>;
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  getAnalysesByDomain(domainId: number): Promise<Analysis[]>;

  // Statistics
  getStats(): Promise<{ domains: number; keywords: number; analyses: number }>;
  
  // Analytics
  getKeywordRankings(domainId: number): Promise<Array<{
    keyword: string;
    totalMentions: number;
    avgSentimentScore: number;
    avgPerformanceScore: number;
  }>>;
  
  getDomainPerformanceByEngine(domainId: number): Promise<Array<{
    engine: string;
    avgSentimentScore: number;
    avgPerformanceScore: number;
    avgResponseTime: number;
    totalAnalyses: number;
  }>>;
}

// PostgreSQL Database Storage
export class PostgreSQLStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    const sql = neon(process.env.DATABASE_URL!);
    this.db = drizzle(sql);
  }

  async getDomain(id: number): Promise<Domain | undefined> {
    const result = await this.db.select().from(domains).where(eq(domains.id, id)).limit(1);
    return result[0];
  }

  async getDomainByName(name: string): Promise<Domain | undefined> {
    const result = await this.db.select().from(domains).where(eq(domains.name, name)).limit(1);
    return result[0];
  }

  async createDomain(insertDomain: InsertDomain): Promise<Domain> {
    const result = await this.db.insert(domains).values(insertDomain).returning();
    return result[0];
  }

  async updateDomain(id: number, updates: Partial<InsertDomain>): Promise<Domain | undefined> {
    const result = await this.db.update(domains).set(updates).where(eq(domains.id, id)).returning();
    return result[0];
  }

  async getAllDomains(): Promise<Domain[]> {
    return await this.db.select().from(domains);
  }

  async getDomainWithKeywords(id: number): Promise<DomainWithKeywords | undefined> {
    const domain = await this.getDomain(id);
    if (!domain) return undefined;
    
    const domainKeywords = await this.getKeywordsByDomain(id);
    return { ...domain, keywords: domainKeywords };
  }

  async getKeywordsByDomain(domainId: number): Promise<Keyword[]> {
    return await this.db.select().from(keywords).where(eq(keywords.domainId, domainId));
  }

  async createKeyword(insertKeyword: InsertKeyword): Promise<Keyword> {
    const result = await this.db.insert(keywords).values(insertKeyword).returning();
    return result[0];
  }

  async updateKeyword(id: number, value: string): Promise<Keyword | undefined> {
    const result = await this.db.update(keywords).set({ value }).where(eq(keywords.id, id)).returning();
    return result[0];
  }

  async deleteKeyword(id: number): Promise<boolean> {
    const result = await this.db.delete(keywords).where(eq(keywords.id, id)).returning();
    return result.length > 0;
  }

  async getPromptsByDomain(domainId: number): Promise<Prompt[]> {
    return await this.db.select().from(prompts).where(eq(prompts.domainId, domainId));
  }

  async createPrompt(insertPrompt: InsertPrompt): Promise<Prompt> {
    const result = await this.db.insert(prompts).values(insertPrompt).returning();
    return result[0];
  }

  async getPrompt(id: number): Promise<Prompt | undefined> {
    const result = await this.db.select().from(prompts).where(eq(prompts.id, id)).limit(1);
    return result[0];
  }

  async getAnalysesByPrompt(promptId: number): Promise<Analysis[]> {
    return await this.db.select().from(analyses).where(eq(analyses.promptId, promptId));
  }

  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    const result = await this.db.insert(analyses).values({
      ...insertAnalysis,
      sentimentScore: insertAnalysis.sentimentScore ?? null,
      responseTime: insertAnalysis.responseTime ?? null,
    }).returning();
    return result[0];
  }

  async getAnalysesByDomain(domainId: number): Promise<Analysis[]> {
    return await this.db.select().from(analyses).where(eq(analyses.domainId, domainId));
  }

  async getStats(): Promise<{ domains: number; keywords: number; analyses: number }> {
    const domainCount = await this.db.select().from(domains);
    const keywordCount = await this.db.select().from(keywords);
    const analysisCount = await this.db.select().from(analyses);
    
    return {
      domains: domainCount.length,
      keywords: keywordCount.length,
      analyses: analysisCount.length,
    };
  }

  async getKeywordRankings(domainId: number): Promise<Array<{
    keyword: string;
    totalMentions: number;
    avgSentimentScore: number;
    avgPerformanceScore: number;
  }>> {
    // Get all keywords for the domain
    const domainKeywords = await this.getKeywordsByDomain(domainId);
    
    const rankings = [];
    
    for (const keyword of domainKeywords) {
      // Count mentions across all analyses for this domain
      const mentionResults = await this.db
        .select({
          sentimentScore: analyses.sentimentScore,
          performanceScore: analyses.performanceScore,
          keywordRelevance: analyses.keywordRelevance,
        })
        .from(analyses)
        .where(eq(analyses.domainId, domainId));
      
      let totalMentions = 0;
      let totalSentiment = 0;
      let totalPerformance = 0;
      let mentionCount = 0;
      
      for (const result of mentionResults) {
        if (result.keywordRelevance && result.keywordRelevance.includes(keyword.value)) {
          totalMentions++;
          if (result.sentimentScore) {
            totalSentiment += result.sentimentScore;
            mentionCount++;
          }
          if (result.performanceScore) {
            totalPerformance += result.performanceScore;
          }
        }
      }
      
      rankings.push({
        keyword: keyword.value,
        totalMentions,
        avgSentimentScore: mentionCount > 0 ? Math.round(totalSentiment / mentionCount) : 0,
        avgPerformanceScore: totalMentions > 0 ? Math.round(totalPerformance / totalMentions) : 0,
      });
    }
    
    // Sort by total mentions descending, then by performance score
    return rankings.sort((a, b) => {
      if (b.totalMentions !== a.totalMentions) {
        return b.totalMentions - a.totalMentions;
      }
      return b.avgPerformanceScore - a.avgPerformanceScore;
    });
  }

  async getDomainPerformanceByEngine(domainId: number): Promise<Array<{
    engine: string;
    avgSentimentScore: number;
    avgPerformanceScore: number;
    avgResponseTime: number;
    totalAnalyses: number;
  }>> {
    const results = await this.db
      .select({
        engine: analyses.engine,
        sentimentScore: analyses.sentimentScore,
        performanceScore: analyses.performanceScore,
        responseTime: analyses.responseTime,
      })
      .from(analyses)
      .where(eq(analyses.domainId, domainId));

    const engineStats: Record<string, {
      totalSentiment: number;
      totalPerformance: number;
      totalResponseTime: number;
      count: number;
    }> = {};

    results.forEach(result => {
      if (!engineStats[result.engine]) {
        engineStats[result.engine] = {
          totalSentiment: 0,
          totalPerformance: 0,
          totalResponseTime: 0,
          count: 0,
        };
      }

      const stats = engineStats[result.engine];
      stats.count++;
      
      if (result.sentimentScore) stats.totalSentiment += result.sentimentScore;
      if (result.performanceScore) stats.totalPerformance += result.performanceScore;
      if (result.responseTime) stats.totalResponseTime += result.responseTime;
    });

    return Object.entries(engineStats).map(([engine, stats]) => ({
      engine,
      avgSentimentScore: stats.count > 0 ? Math.round(stats.totalSentiment / stats.count) : 0,
      avgPerformanceScore: stats.count > 0 ? Math.round(stats.totalPerformance / stats.count) : 0,
      avgResponseTime: stats.count > 0 ? Math.round(stats.totalResponseTime / stats.count) : 0,
      totalAnalyses: stats.count,
    }));
  }
}

export const storage = new PostgreSQLStorage();
