// Service for managing shop listings in D1 database
export class ShopListingService {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  // Get all shop listings
  async getAll() {
    const { results } = await this.db
      .prepare("SELECT * FROM shop_listings ORDER BY created_at DESC")
      .all();
    return results;
  }

  // Get featured listings for portfolio page
  async getFeatured() {
    const { results } = await this.db
      .prepare("SELECT * FROM shop_listings WHERE featured = 1 ORDER BY created_at DESC LIMIT 6")
      .all();
    return results;
  }

  // Get a single listing by ID
  async getById(id: number) {
    const result = await this.db
      .prepare("SELECT * FROM shop_listings WHERE id = ?")
      .bind(id)
      .first();
    return result;
  }

  // Create a new listing
  async create(data: {
    title: string;
    type: string;
    length?: string;
    bpm?: number;
    key?: string;
    image_url?: string;
    preview_audio_url?: string;
    price: number;
    stripe_price_id?: string;
    description?: string;
    featured?: boolean;
  }) {
    const result = await this.db
      .prepare(
        `INSERT INTO shop_listings 
         (title, type, length, bpm, key, image_url, preview_audio_url, price, stripe_price_id, description, featured) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        data.title,
        data.type,
        data.length || null,
        data.bpm || null,
        data.key || null,
        data.image_url || null,
        data.preview_audio_url || null,
        data.price,
        data.stripe_price_id || null,
        data.description || null,
        data.featured ? 1 : 0
      )
      .run();
    return result;
  }

  // Update a listing
  async update(
    id: number,
    data: {
      title?: string;
      type?: string;
      length?: string;
      bpm?: number;
      key?: string;
      image_url?: string;
      preview_audio_url?: string;
      price?: number;
      stripe_price_id?: string;
      description?: string;
      featured?: boolean;
    }
  ) {
    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(key === "featured" ? (value ? 1 : 0) : value);
      }
    });

    if (updates.length === 0) {
      return { success: false, message: "No fields to update" };
    }

    values.push(id); // Add id as last parameter for WHERE clause

    const result = await this.db
      .prepare(`UPDATE shop_listings SET ${updates.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();

    return result;
  }

  // Delete a listing
  async delete(id: number) {
    const result = await this.db
      .prepare("DELETE FROM shop_listings WHERE id = ?")
      .bind(id)
      .run();
    return result;
  }
}
