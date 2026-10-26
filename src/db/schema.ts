import { mysqlTable, text, varchar, decimal, timestamp, boolean, int, json, mysqlEnum } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

const roleValues = ["user", "admin", "finance_operator", "support_agent", "super_admin"] as const;
const accountStatusValues = ["active", "suspended", "pending_verification", "closed"] as const;
const txTypeValues = ["deposit", "investment", "earning", "referral_reward", "withdrawal", "refund", "adjustment", "fee"] as const;
const txStatusValues = ["pending", "completed", "failed", "reversed"] as const;
const withdrawalStatusValues = ["pending", "under_review", "approved", "rejected", "processing", "completed"] as const;
const notificationTypeValues = ["registration", "referral", "transaction", "withdrawal", "support", "system"] as const;
const ticketStatusValues = ["open", "in_progress", "resolved", "closed"] as const;
const ticketPriorityValues = ["low", "medium", "high", "urgent"] as const;

export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  role: mysqlEnum("role", roleValues).notNull().default("user"),
  accountStatus: mysqlEnum("account_status", accountStatusValues).notNull().default("active"),
  referralCode: varchar("referral_code", { length: 12 }).notNull().unique(),
  referredBy: varchar("referred_by", { length: 36 }),
  avatar: text("avatar"),
  language: varchar("language", { length: 10 }).default("en"),
  darkMode: boolean("dark_mode").default(false),
  emailVerified: boolean("email_verified").default(false),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sessions = mysqlTable("sessions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 512 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userProfiles = mysqlTable("user_profiles", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  address: text("address"),
  addressLine2: text("address_line_2"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }),
  idType: varchar("id_type", { length: 50 }),
  idNumber: varchar("id_number", { length: 255 }),
  idProofPath: varchar("id_proof_path", { length: 512 }),
  bankName: varchar("bank_name", { length: 100 }),
  bankAccount: varchar("bank_account", { length: 100 }),
  upiId: varchar("upi_id", { length: 100 }),
  panNumber: varchar("pan_number", { length: 20 }),
  bio: text("bio"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const referralRelationships = mysqlTable("referral_relationships", {
  id: varchar("id", { length: 36 }).primaryKey(),
  referrerId: varchar("referrer_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  referredId: varchar("referred_id", { length: 36 }).notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  level: int("level").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const walletAccounts = mysqlTable("wallet_accounts", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  balance: decimal("balance", { precision: 18, scale: 2 }).notNull().default("0.00"),
  totalInvested: decimal("total_invested", { precision: 18, scale: 2 }).notNull().default("0.00"),
  totalEarnings: decimal("total_earnings", { precision: 18, scale: 2 }).notNull().default("0.00"),
  totalWithdrawn: decimal("total_withdrawn", { precision: 18, scale: 2 }).notNull().default("0.00"),
  currency: varchar("currency", { length: 10 }).notNull().default("INR"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const ledgerEntries = mysqlTable("ledger_entries", {
  id: varchar("id", { length: 36 }).primaryKey(),
  referenceId: varchar("reference_id", { length: 32 }).notNull().unique(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  type: mysqlEnum("type", txTypeValues).notNull(),
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("INR"),
  status: mysqlEnum("status", txStatusValues).notNull().default("completed"),
  description: text("description"),
  relatedReference: varchar("related_reference", { length: 32 }),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const investmentRecords = mysqlTable("investment_records", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  planName: varchar("plan_name", { length: 100 }).notNull(),
  ratePercent: decimal("rate_percent", { precision: 5, scale: 2 }).notNull(),
  durationDays: int("duration_days").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  earningsGenerated: decimal("earnings_generated", { precision: 18, scale: 2 }).notNull().default("0.00"),
  ledgerReference: varchar("ledger_reference", { length: 32 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const withdrawalRequests = mysqlTable("withdrawal_requests", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("INR"),
  method: varchar("method", { length: 50 }).notNull().default("bank_transfer"),
  destination: text("destination"),
  status: mysqlEnum("status", withdrawalStatusValues).notNull().default("pending"),
  reviewNote: text("review_note"),
  reviewedBy: varchar("reviewed_by", { length: 36 }),
  ledgerReference: varchar("ledger_reference", { length: 32 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const calculationConfigs = mysqlTable("calculation_configs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  ratePercent: decimal("rate_percent", { precision: 5, scale: 2 }).notNull(),
  ratePeriod: varchar("rate_period", { length: 20 }).notNull().default("daily"),
  minAmount: decimal("min_amount", { precision: 18, scale: 2 }).default("0.00"),
  maxAmount: decimal("max_amount", { precision: 18, scale: 2 }),
  effectiveFrom: timestamp("effective_from").notNull(),
  effectiveTo: timestamp("effective_to"),
  eligibility: text("eligibility"),
  roundingRule: varchar("rounding_rule", { length: 20 }).default("standard"),
  version: int("version").notNull().default(1),
  approved: boolean("approved").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const calculationHistory = mysqlTable("calculation_history", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  configId: varchar("config_id", { length: 36 }).references(() => calculationConfigs.id),
  baseAmount: decimal("base_amount", { precision: 18, scale: 2 }).notNull(),
  ratePercent: decimal("rate_percent", { precision: 5, scale: 2 }).notNull(),
  calculatedAmount: decimal("calculated_amount", { precision: 18, scale: 2 }).notNull(),
  isSimulation: boolean("is_simulation").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = mysqlTable("notifications", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  type: mysqlEnum("type", notificationTypeValues).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  link: text("link"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const supportTickets = mysqlTable("support_tickets", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  subject: varchar("subject", { length: 255 }).notNull(),
  message: text("message").notNull(),
  status: mysqlEnum("status", ticketStatusValues).notNull().default("open"),
  priority: mysqlEnum("priority", ticketPriorityValues).notNull().default("medium"),
  assignedTo: varchar("assigned_to", { length: 36 }),
  response: text("response"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const auditLogs = mysqlTable("audit_logs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  actorId: varchar("actor_id", { length: 36 }).references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  entity: varchar("entity", { length: 100 }).notNull(),
  entityId: varchar("entity_id", { length: 36 }),
  details: json("details"),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const systemSettings = mysqlTable("system_settings", {
  id: varchar("id", { length: 36 }).primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const paymentOrders = mysqlTable("payment_orders", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 32 }).notNull().default("razorpay"),
  providerOrderId: varchar("provider_order_id", { length: 64 }).notNull().unique(),
  providerPaymentId: varchar("provider_payment_id", { length: 64 }).unique(),
  signature: text("signature"),
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("INR"),
  status: varchar("status", { length: 20 }).notNull().default("created"),
  planName: varchar("plan_name", { length: 100 }).notNull(),
  ratePercent: decimal("rate_percent", { precision: 5, scale: 2 }).notNull(),
  durationDays: int("duration_days").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  paidAt: timestamp("paid_at"),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  wallet: one(walletAccounts),
  profile: one(userProfiles),
  referralsGiven: many(referralRelationships, { relationName: "referrer" }),
  referralsReceived: many(referralRelationships, { relationName: "referred" }),
  ledger: many(ledgerEntries),
}));

export const walletAccountsRelations = relations(walletAccounts, ({ one }) => ({
  user: one(users, { fields: [walletAccounts.userId], references: [users.id] }),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, { fields: [userProfiles.userId], references: [users.id] }),
}));

export const referralRelationshipsRelations = relations(referralRelationships, ({ one }) => ({
  referrer: one(users, {
    fields: [referralRelationships.referrerId],
    references: [users.id],
    relationName: "referrer",
  }),
  referred: one(users, {
    fields: [referralRelationships.referredId],
    references: [users.id],
    relationName: "referred",
  }),
}));

export const ledgerEntriesRelations = relations(ledgerEntries, ({ one }) => ({
  user: one(users, { fields: [ledgerEntries.userId], references: [users.id] }),
}));

