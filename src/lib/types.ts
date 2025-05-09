// src/lib/types.ts

export interface Supplier {
  id: string;
  name: string;
  contactEmail?: string;
  performanceRating?: number; // e.g., 1-5 stars
  leadTimeDays?: number; // Average lead time
  onTimeDeliveryRate?: number; // Percentage (0.0 to 1.0)
  // Add other relevant supplier fields
}

// Add other shared types here as your application grows
// For example, PurchaseOrder, Sale, etc.
