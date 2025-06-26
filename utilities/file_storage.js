const fs = require('fs').promises;
const path = require('path');
const StorageInterface = require('./storage_interface');

class FileStorage extends StorageInterface {
  constructor(storagePath = './data/events.json') {
    super();
    this.storagePath = storagePath;
  }

  /**
   * Initialize the storage backend
   */
  async initialize() {
    await this.ensureDataDirectory();
  }

  /**
   * Ensures the data directory exists
   */
  async ensureDataDirectory() {
    const dir = path.dirname(this.storagePath);
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Load all events from storage
   */
  async loadEvents() {
    try {
      const data = await fs.readFile(this.storagePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      // If file doesn't exist or is invalid, return empty array
      return [];
    }
  }

  /**
   * Save all events to storage
   */
  async saveEvents(events) {
    await this.ensureDataDirectory();
    await fs.writeFile(this.storagePath, JSON.stringify(events, null, 2));
  }

  /**
   * Add a single event to storage
   */
  async addEvent(event) {
    const events = await this.loadEvents();
    events.push(event);
    await this.saveEvents(events);
    return event;
  }

  /**
   * Update a single event in storage
   */
  async updateEvent(eventId, eventData) {
    const events = await this.loadEvents();
    const eventIndex = events.findIndex(event => event.id === eventId);
    
    if (eventIndex === -1) {
      throw new Error('Event not found');
    }

    const updatedEvent = {
      ...events[eventIndex],
      ...eventData,
      updatedAt: new Date().toISOString()
    };

    events[eventIndex] = updatedEvent;
    await this.saveEvents(events);
    
    return updatedEvent;
  }

  /**
   * Delete a single event from storage
   */
  async deleteEvent(eventId) {
    const events = await this.loadEvents();
    const eventIndex = events.findIndex(event => event.id === eventId);
    
    if (eventIndex === -1) {
      throw new Error('Event not found');
    }

    const deletedEvent = events.splice(eventIndex, 1)[0];
    await this.saveEvents(events);
    
    return deletedEvent;
  }

  /**
   * Get a single event by ID
   */
  async getEventById(eventId) {
    const events = await this.loadEvents();
    return events.find(event => event.id === eventId);
  }

  /**
   * Search events by criteria
   */
  async searchEvents(criteria) {
    const events = await this.loadEvents();
    const { query, userId, startDate, endDate } = criteria;
    
    return events.filter(event => {
      let matches = true;
      
      // Search by query (title or description)
      if (query) {
        const searchTerm = query.toLowerCase();
        matches = matches && (
          event.title.toLowerCase().includes(searchTerm) ||
          event.description.toLowerCase().includes(searchTerm)
        );
      }
      
      // Filter by user
      if (userId) {
        matches = matches && event.createdBy === userId;
      }
      
      // Filter by date range
      if (startDate || endDate) {
        const eventStart = new Date(event.startTime);
        if (startDate && eventStart < startDate) {
          matches = false;
        }
        if (endDate && eventStart > endDate) {
          matches = false;
        }
      }
      
      return matches;
    });
  }

  /**
   * Get events within a date range
   */
  async getEventsInRange(startDate, endDate) {
    return await this.searchEvents({ startDate, endDate });
  }

  /**
   * Get events created by a specific user
   */
  async getEventsByUser(userId) {
    return await this.searchEvents({ userId });
  }

  /**
   * Close/cleanup storage connection
   */
  async close() {
    // No cleanup needed for file storage
  }
}

module.exports = FileStorage; 
