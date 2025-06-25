import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const domains = pgTable("domains", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const keywords = pgTable("keywords", {
  id: serial("id").primaryKey(),
  domainId: integer("domain_id").notNull(),
  value: text("value").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const prompts = pgTable("prompts", {
  id: serial("id").primaryKey(),
  domainId: integer("domain_id").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const analyses = pgTable("analyses", {
  id: serial("id").primaryKey(),
  domainId: integer("domain_id").notNull(),
  promptId: integer("prompt_id").notNull(),
  engine: text("engine").notNull(), // 'openai', 'gemini'
  response: text("response").notNull(),
  sentimentScore: integer("sentiment_score"),
  responseTime: integer("response_time"), // in milliseconds
  keywordRelevance: text("keyword_relevance").array(), // keywords mentioned in analysis
  performanceScore: integer("performance_score"), // overall performance rating 1-100
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDomainSchema = createInsertSchema(domains).pick({
  name: true,
  description: true,
});

export const insertKeywordSchema = createInsertSchema(keywords).pick({
  domainId: true,
  value: true,
});

export const insertPromptSchema = createInsertSchema(prompts).pick({
  domainId: true,
  content: true,
  category: true,
});

export const insertAnalysisSchema = createInsertSchema(analyses).pick({
  domainId: true,
  promptId: true,
  engine: true,
  response: true,
  sentimentScore: true,
  responseTime: true,
  keywordRelevance: true,
  performanceScore: true,
});

export type Domain = typeof domains.$inferSelect;
export type InsertDomain = z.infer<typeof insertDomainSchema>;

export type Keyword = typeof keywords.$inferSelect;
export type InsertKeyword = z.infer<typeof insertKeywordSchema>;

export type Prompt = typeof prompts.$inferSelect;
export type InsertPrompt = z.infer<typeof insertPromptSchema>;

export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;

export type DomainWithKeywords = Domain & {
  keywords: Keyword[];
};

export type AnalysisComparison = {
  domain: Domain;
  prompt: Prompt;
  analyses: Analysis[];
};
