import { eq, and, count, desc, or, ilike } from "drizzle-orm";
import { db } from "./db";
import {
  type User, type InsertUser, users,
  type Family, type InsertFamily, families,
  type FamilyMember, type InsertFamilyMember, familyMembers,
  type Recipe, type InsertRecipe, recipes,
  type FamilyRecipe, type InsertFamilyRecipe, familyRecipes,
  type FamilyRecipeLike, type InsertFamilyRecipeLike, familyRecipeLikes,
  type FamilyMessage, type InsertFamilyMessage, familyMessages,
  type MessageReaction, type InsertMessageReaction, messageReactions,
} from "@shared/schema";

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createFamily(name: string, ownerUserId: string): Promise<Family>;
  getFamilyByCode(code: string): Promise<Family | undefined>;
  getFamilyById(id: string): Promise<Family | undefined>;
  getUserFamily(userId: string): Promise<{ family: Family; member: FamilyMember } | undefined>;
  
  joinFamily(familyId: string, userId: string): Promise<FamilyMember>;
  getFamilyMembers(familyId: string): Promise<(FamilyMember & { user: User })[]>;
  
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  getRecipesByUser(userId: string): Promise<Recipe[]>;
  shareRecipeToFamily(familyId: string, recipeId: string, sharedByUserId: string): Promise<FamilyRecipe>;
  getFamilyRecipes(familyId: string): Promise<(Recipe & { sharedBy: User; likeCount: number })[]>;
  
  toggleRecipeLike(familyId: string, recipeId: string, userId: string): Promise<boolean>;
  getRecipeLikes(familyId: string, recipeId: string): Promise<number>;
  hasUserLikedRecipe(familyId: string, recipeId: string, userId: string): Promise<boolean>;
  
  createFamilyMessage(message: InsertFamilyMessage): Promise<FamilyMessage>;
  getFamilyMessages(familyId: string): Promise<(FamilyMessage & { author: User; reactions: MessageReaction[] })[]>;
  
  addMessageReaction(messageId: string, userId: string, emoji: string): Promise<MessageReaction>;
  removeMessageReaction(reactionId: string): Promise<void>;
  
  getFamilyStats(familyId: string): Promise<{ recipeCount: number; likeCount: number; messageCount: number; memberCount: number }>;
  
  searchPublicRecipes(query?: string): Promise<Recipe[]>;
  updateRecipeVisibility(recipeId: string, isPublic: boolean): Promise<Recipe>;
  getRecipeById(recipeId: string): Promise<Recipe | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createFamily(name: string, ownerUserId: string): Promise<Family> {
    const inviteCode = generateInviteCode();
    const [family] = await db.insert(families).values({
      name,
      ownerUserId,
      inviteCode,
    }).returning();
    
    await db.insert(familyMembers).values({
      familyId: family.id,
      userId: ownerUserId,
      role: "owner",
    });
    
    return family;
  }

  async getFamilyByCode(code: string): Promise<Family | undefined> {
    const [family] = await db.select().from(families).where(eq(families.inviteCode, code.toUpperCase()));
    return family;
  }

  async getFamilyById(id: string): Promise<Family | undefined> {
    const [family] = await db.select().from(families).where(eq(families.id, id));
    return family;
  }

  async getUserFamily(userId: string): Promise<{ family: Family; member: FamilyMember } | undefined> {
    const result = await db
      .select()
      .from(familyMembers)
      .innerJoin(families, eq(familyMembers.familyId, families.id))
      .where(eq(familyMembers.userId, userId))
      .limit(1);
    
    if (result.length === 0) return undefined;
    return { family: result[0].families, member: result[0].family_members };
  }

  async joinFamily(familyId: string, userId: string): Promise<FamilyMember> {
    const existing = await db.select().from(familyMembers)
      .where(and(eq(familyMembers.familyId, familyId), eq(familyMembers.userId, userId)));
    
    if (existing.length > 0) return existing[0];
    
    const [member] = await db.insert(familyMembers).values({
      familyId,
      userId,
      role: "member",
    }).returning();
    
    return member;
  }

  async getFamilyMembers(familyId: string): Promise<(FamilyMember & { user: User })[]> {
    const result = await db
      .select()
      .from(familyMembers)
      .innerJoin(users, eq(familyMembers.userId, users.id))
      .where(eq(familyMembers.familyId, familyId));
    
    return result.map(r => ({ ...r.family_members, user: r.users }));
  }

  async createRecipe(recipe: InsertRecipe): Promise<Recipe> {
    const [newRecipe] = await db.insert(recipes).values(recipe).returning();
    return newRecipe;
  }

  async getRecipesByUser(userId: string): Promise<Recipe[]> {
    return db.select().from(recipes).where(eq(recipes.authorUserId, userId));
  }

  async shareRecipeToFamily(familyId: string, recipeId: string, sharedByUserId: string): Promise<FamilyRecipe> {
    const [shared] = await db.insert(familyRecipes).values({
      familyId,
      recipeId,
      sharedByUserId,
    }).returning();
    return shared;
  }

  async getFamilyRecipes(familyId: string): Promise<(Recipe & { sharedBy: User; likeCount: number })[]> {
    const result = await db
      .select()
      .from(familyRecipes)
      .innerJoin(recipes, eq(familyRecipes.recipeId, recipes.id))
      .innerJoin(users, eq(familyRecipes.sharedByUserId, users.id))
      .where(eq(familyRecipes.familyId, familyId))
      .orderBy(desc(familyRecipes.sharedAt));
    
    const recipesWithLikes = await Promise.all(result.map(async r => {
      const likeCount = await this.getRecipeLikes(familyId, r.recipes.id);
      return { ...r.recipes, sharedBy: r.users, likeCount };
    }));
    
    return recipesWithLikes;
  }

  async toggleRecipeLike(familyId: string, recipeId: string, userId: string): Promise<boolean> {
    const existing = await db.select().from(familyRecipeLikes)
      .where(and(
        eq(familyRecipeLikes.familyId, familyId),
        eq(familyRecipeLikes.recipeId, recipeId),
        eq(familyRecipeLikes.userId, userId)
      ));
    
    if (existing.length > 0) {
      await db.delete(familyRecipeLikes).where(eq(familyRecipeLikes.id, existing[0].id));
      return false;
    }
    
    await db.insert(familyRecipeLikes).values({ familyId, recipeId, userId });
    return true;
  }

  async getRecipeLikes(familyId: string, recipeId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(familyRecipeLikes)
      .where(and(eq(familyRecipeLikes.familyId, familyId), eq(familyRecipeLikes.recipeId, recipeId)));
    return result[0]?.count ?? 0;
  }

  async hasUserLikedRecipe(familyId: string, recipeId: string, userId: string): Promise<boolean> {
    const result = await db.select().from(familyRecipeLikes)
      .where(and(
        eq(familyRecipeLikes.familyId, familyId),
        eq(familyRecipeLikes.recipeId, recipeId),
        eq(familyRecipeLikes.userId, userId)
      ));
    return result.length > 0;
  }

  async createFamilyMessage(message: InsertFamilyMessage): Promise<FamilyMessage> {
    const [newMessage] = await db.insert(familyMessages).values(message).returning();
    return newMessage;
  }

  async getFamilyMessages(familyId: string): Promise<(FamilyMessage & { author: User; reactions: MessageReaction[] })[]> {
    const result = await db
      .select()
      .from(familyMessages)
      .innerJoin(users, eq(familyMessages.authorUserId, users.id))
      .where(eq(familyMessages.familyId, familyId))
      .orderBy(desc(familyMessages.createdAt));
    
    const messagesWithReactions = await Promise.all(result.map(async r => {
      const reactions = await db.select().from(messageReactions)
        .where(eq(messageReactions.messageId, r.family_messages.id));
      return { ...r.family_messages, author: r.users, reactions };
    }));
    
    return messagesWithReactions;
  }

  async addMessageReaction(messageId: string, userId: string, emoji: string): Promise<MessageReaction> {
    const [reaction] = await db.insert(messageReactions).values({ messageId, userId, emoji }).returning();
    return reaction;
  }

  async removeMessageReaction(reactionId: string): Promise<void> {
    await db.delete(messageReactions).where(eq(messageReactions.id, reactionId));
  }

  async getFamilyStats(familyId: string): Promise<{ recipeCount: number; likeCount: number; messageCount: number; memberCount: number }> {
    const [recipeResult] = await db.select({ count: count() }).from(familyRecipes).where(eq(familyRecipes.familyId, familyId));
    const [likeResult] = await db.select({ count: count() }).from(familyRecipeLikes).where(eq(familyRecipeLikes.familyId, familyId));
    const [messageResult] = await db.select({ count: count() }).from(familyMessages).where(eq(familyMessages.familyId, familyId));
    const [memberResult] = await db.select({ count: count() }).from(familyMembers).where(eq(familyMembers.familyId, familyId));
    
    return {
      recipeCount: recipeResult?.count ?? 0,
      likeCount: likeResult?.count ?? 0,
      messageCount: messageResult?.count ?? 0,
      memberCount: memberResult?.count ?? 0,
    };
  }

  async searchPublicRecipes(query?: string): Promise<Recipe[]> {
    if (query && query.trim()) {
      const searchTerm = `%${query.trim()}%`;
      return db.select().from(recipes)
        .where(and(
          eq(recipes.isPublic, true),
          or(
            ilike(recipes.title, searchTerm),
            ilike(recipes.description, searchTerm),
            ilike(recipes.category, searchTerm)
          )
        ))
        .orderBy(desc(recipes.createdAt));
    }
    return db.select().from(recipes)
      .where(eq(recipes.isPublic, true))
      .orderBy(desc(recipes.createdAt));
  }

  async updateRecipeVisibility(recipeId: string, isPublic: boolean): Promise<Recipe> {
    const [updated] = await db.update(recipes)
      .set({ isPublic })
      .where(eq(recipes.id, recipeId))
      .returning();
    return updated;
  }

  async getRecipeById(recipeId: string): Promise<Recipe | undefined> {
    const [recipe] = await db.select().from(recipes).where(eq(recipes.id, recipeId));
    return recipe;
  }
}

export const storage = new DatabaseStorage();
