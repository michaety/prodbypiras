// Service for managing tracks within shop listings in D1 database
export class TrackService {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  // Get all tracks for a listing
  async getByListingId(listingId: number) {
    const { results } = await this.db
      .prepare(
        "SELECT * FROM tracks WHERE listing_id = ? ORDER BY track_order ASC, id ASC"
      )
      .bind(listingId)
      .all();
    return results;
  }

  // Get a single track by ID
  async getById(id: number) {
    const result = await this.db
      .prepare("SELECT * FROM tracks WHERE id = ?")
      .bind(id)
      .first();
    return result;
  }

  // Create a new track
  async create(data: {
    listing_id: number;
    title: string;
    length?: string;
    bpm?: number;
    key?: string;
    audio_url?: string;
    track_order?: number;
  }) {
    const result = await this.db
      .prepare(
        `INSERT INTO tracks 
         (listing_id, title, length, bpm, key, audio_url, track_order) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        data.listing_id,
        data.title,
        data.length || null,
        data.bpm || null,
        data.key || null,
        data.audio_url || null,
        data.track_order || 0
      )
      .run();
    return result;
  }

  // Update a track
  async update(
    id: number,
    data: {
      title?: string;
      length?: string;
      bpm?: number;
      key?: string;
      audio_url?: string;
      track_order?: number;
    }
  ) {
    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (updates.length === 0) {
      return { success: false, message: "No fields to update" };
    }

    values.push(id); // Add id as last parameter for WHERE clause

    const result = await this.db
      .prepare(`UPDATE tracks SET ${updates.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();

    return result;
  }

  // Delete a track
  async delete(id: number) {
    const result = await this.db
      .prepare("DELETE FROM tracks WHERE id = ?")
      .bind(id)
      .run();
    return result;
  }

  // Delete all tracks for a listing
  async deleteByListingId(listingId: number) {
    const result = await this.db
      .prepare("DELETE FROM tracks WHERE listing_id = ?")
      .bind(listingId)
      .run();
    return result;
  }
}
