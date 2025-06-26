const FileStorage = require('./file_storage');

class EventManager {
  constructor(storageBackend = null) {
    // Default to file storage if no backend provided
    this.storage = storageBackend || new FileStorage();
    this.initialized = false;
  }

  /**
   * Initialize the event manager
   */
  async initialize() {
    if (!this.initialized) {
      await this.storage.initialize();
      this.initialized = true;
    }
  }

  /**
   * Ensure the manager is initialized before operations
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Generate a unique ID for events
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Create a new event
   */
  async createEvent(eventData) {
    await this.ensureInitialized();
    
    const newEvent = {
      id: this.generateId(),
      title: eventData.title,
      description: eventData.description || '',
      startTime: eventData.startTime,
      endTime: eventData.endTime,
      location: eventData.location || '',
      createdBy: eventData.createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return await this.storage.addEvent(newEvent);
  }

  /**
   * Get all events
   */
  async getAllEvents() {
    await this.ensureInitialized();
    return await this.storage.loadEvents();
  }

  /**
   * Get events within a date range
   */
  async getEventsInRange(startDate, endDate) {
    await this.ensureInitialized();
    return await this.storage.getEventsInRange(startDate, endDate);
  }

  /**
   * Get upcoming events (from now until specified days ahead)
   */
  async getUpcomingEvents(daysAhead = 14) {
    await this.ensureInitialized();
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(now.getDate() + daysAhead);
    
    return await this.storage.getEventsInRange(now, endDate);
  }

  /**
   * Get event by ID
   */
  async getEventById(eventId) {
    await this.ensureInitialized();
    return await this.storage.getEventById(eventId);
  }

  /**
   * Update an existing event
   */
  async updateEvent(eventId, updateData) {
    await this.ensureInitialized();
    return await this.storage.updateEvent(eventId, updateData);
  }

  /**
   * Delete an event
   */
  async deleteEvent(eventId) {
    await this.ensureInitialized();
    return await this.storage.deleteEvent(eventId);
  }

  /**
   * Search events by title or description
   */
  async searchEvents(query) {
    await this.ensureInitialized();
    return await this.storage.searchEvents({ query });
  }

  /**
   * Get events created by a specific user
   */
  async getEventsByUser(userId) {
    await this.ensureInitialized();
    return await this.storage.getEventsByUser(userId);
  }

  /**
   * Advanced search with multiple criteria
   */
  async searchEventsAdvanced(criteria) {
    await this.ensureInitialized();
    return await this.storage.searchEvents(criteria);
  }

  /**
   * Close the storage connection
   */
  async close() {
    await this.storage.close();
  }
}

module.exports = EventManager; 
