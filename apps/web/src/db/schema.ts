import { pgTable, text, timestamp, integer, boolean, decimal, json, uuid, primaryKey, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table (synced with Stack Auth)
export const users = pgTable('users', {
  id: text('id').primaryKey(), // Stack Auth user ID
  email: text('email').notNull().unique(),
  name: text('name'),
  role: text('role').notNull().default('user'), // user, contractor, admin
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Contractors table
export const contractors = pgTable('contractors', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  businessName: text('business_name'),
  category: text('category').notNull(),
  description: text('description').notNull(),

  // Location
  address: text('address'),
  city: text('city').notNull(),
  state: text('state').notNull(),
  zipCode: text('zip_code'),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),

  // Contact
  phone: text('phone'),
  email: text('email'),
  website: text('website'),

  // Business details
  licenseNumber: text('license_number'),
  insuranceVerified: boolean('insurance_verified').default(false),
  yearsInBusiness: integer('years_in_business'),
  employeeCount: integer('employee_count'),

  // Ratings & verification
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0'),
  reviewCount: integer('review_count').default(0),
  verified: boolean('verified').default(false),
  featured: boolean('featured').default(false),

  // Metadata
  specialties: json('specialties').$type<string[]>().default([]),
  serviceAreas: json('service_areas').$type<string[]>().default([]),
  certifications: json('certifications').$type<string[]>().default([]),
  imageUrl: text('image_url'),
  logoUrl: text('logo_url'),

  // Status
  status: text('status').notNull().default('pending'), // pending, active, suspended, inactive

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  categoryIdx: index('contractor_category_idx').on(table.category),
  locationIdx: index('contractor_location_idx').on(table.city, table.state),
  statusIdx: index('contractor_status_idx').on(table.status),
  userIdIdx: index('contractor_user_id_idx').on(table.userId),
}));

// Reviews table
export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  contractorId: uuid('contractor_id').notNull().references(() => contractors.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Review details
  rating: integer('rating').notNull(), // 1-5
  title: text('title'),
  content: text('content').notNull(),

  // Project details
  projectType: text('project_type'),
  projectCost: decimal('project_cost', { precision: 10, scale: 2 }),
  completionDate: timestamp('completion_date'),

  // Verification
  verified: boolean('verified').default(false),

  // Response from contractor
  response: text('response'),
  responseDate: timestamp('response_date'),

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  contractorIdIdx: index('review_contractor_id_idx').on(table.contractorId),
  userIdIdx: index('review_user_id_idx').on(table.userId),
  ratingIdx: index('review_rating_idx').on(table.rating),
}));

// Review photos
export const reviewPhotos = pgTable('review_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  reviewId: uuid('review_id').notNull().references(() => reviews.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  caption: text('caption'),
  order: integer('order').default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Portfolio/Gallery for contractors
export const portfolioItems = pgTable('portfolio_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  contractorId: uuid('contractor_id').notNull().references(() => contractors.id, { onDelete: 'cascade' }),

  title: text('title').notNull(),
  description: text('description'),
  category: text('category'),
  imageUrl: text('image_url').notNull(),

  projectDate: timestamp('project_date'),
  featured: boolean('featured').default(false),
  order: integer('order').default(0),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  contractorIdIdx: index('portfolio_contractor_id_idx').on(table.contractorId),
}));

// Lead/Contact requests
export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  contractorId: uuid('contractor_id').notNull().references(() => contractors.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),

  // Contact details
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),

  // Project details
  projectType: text('project_type'),
  description: text('description').notNull(),
  budget: text('budget'),
  timeline: text('timeline'),

  // Address for project
  address: text('address'),
  city: text('city'),
  state: text('state'),
  zipCode: text('zip_code'),

  // Status
  status: text('status').notNull().default('new'), // new, contacted, quoted, won, lost

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  contractorIdIdx: index('lead_contractor_id_idx').on(table.contractorId),
  statusIdx: index('lead_status_idx').on(table.status),
}));

// Categories (predefined contractor categories)
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  icon: text('icon'),
  parentId: uuid('parent_id').references((): any => categories.id),
  order: integer('order').default(0),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  contractors: many(contractors),
  reviews: many(reviews),
  leads: many(leads),
}));

export const contractorsRelations = relations(contractors, ({ one, many }) => ({
  user: one(users, {
    fields: [contractors.userId],
    references: [users.id],
  }),
  reviews: many(reviews),
  portfolio: many(portfolioItems),
  leads: many(leads),
}));

export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  contractor: one(contractors, {
    fields: [reviews.contractorId],
    references: [contractors.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  photos: many(reviewPhotos),
}));

export const reviewPhotosRelations = relations(reviewPhotos, ({ one }) => ({
  review: one(reviews, {
    fields: [reviewPhotos.reviewId],
    references: [reviews.id],
  }),
}));

export const portfolioItemsRelations = relations(portfolioItems, ({ one }) => ({
  contractor: one(contractors, {
    fields: [portfolioItems.contractorId],
    references: [contractors.id],
  }),
}));

export const leadsRelations = relations(leads, ({ one }) => ({
  contractor: one(contractors, {
    fields: [leads.contractorId],
    references: [contractors.id],
  }),
  user: one(users, {
    fields: [leads.userId],
    references: [users.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
  children: many(categories),
}));
