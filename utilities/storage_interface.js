/**
 * Abstract storage interface for event data
 * This interface defines the contract that all storage backends must implement
 */
class StorageInterface {
  /**
   * Initialize the storage backend
   */
  async initialize() {
    throw new Error('initialize() method must be implemented');
  }

  /**
   * Load all events from storage
   */
  async loadEvents() {
    throw new Error('loadEvents() method must be implemented');
  }

  /**
   * Save all events to storage
   */
  async saveEvents(events) {
    throw new Error('saveEvents() method must be implemented');
  }

  /**
   * Add a single event to storage
   */
  async addEvent(event) {
    throw new Error('addEvent() method must be implemented');
  }

  /**
   * Update a single event in storage
   */
  async updateEvent(eventId, eventData) {
    throw new Error('updateEvent() method must be implemented');
  }

  /**
   * Delete a single event from storage
   */
  async deleteEvent(eventId) {
    throw new Error('deleteEvent() method must be implemented');
  }

  /**
   * Get a single event by ID
   */
  async getEventById(eventId) {
    throw new Error('getEventById() method must be implemented');
  }

  /**
   * Search events by criteria
   */
  async searchEvents(criteria) {
    throw new Error('searchEvents() method must be implemented');
  }

  /**
   * Get events within a date range
   */
  async getEventsInRange(startDate, endDate) {
    throw new Error('getEventsInRange() method must be implemented');
  }

  /**
   * Get events created by a specific user
   */
  async getEventsByUser(userId) {
    throw new Error('getEventsByUser() method must be implemented');
  }

  /**
   * Close/cleanup storage connection
   */
  async close() {
    throw new Error('close() method must be implemented');
  }
}

module.exports = StorageInterface; 
