# Event System Documentation

## Overview

The event system has been completely revamped to move away from Google Calendar API dependency. The new system provides a local file-based storage solution that is extensible for future database integration.

## Architecture

### Core Components

1. **EventManager** (`utilities/event_manager.js`)
   - Main interface for event operations
   - Handles business logic and data validation
   - Extensible through storage backends

2. **StorageInterface** (`utilities/storage_interface.js`)
   - Abstract interface defining storage contract
   - Ensures consistent API across different storage backends

3. **FileStorage** (`utilities/file_storage.js`)
   - Local JSON file-based storage implementation
   - Implements StorageInterface for file operations

4. **DatabaseStorage** (`utilities/database_storage_example.js`)
   - Example database storage implementation
   - Demonstrates how to extend the system for database integration

### Discord Commands

- **`/create-event`** - Create a new event
- **`/list-events`** - List upcoming events
- **`/update-event`** - Update an existing event
- **`/delete-event`** - Delete an existing event
- **`/events`** - Legacy command updated to use new system

## Features

### Event Management
- ✅ Create events with title, description, start/end times, and location
- ✅ Update existing events (only by event creator)
- ✅ Delete events (only by event creator)
- ✅ List upcoming events with customizable time range
- ✅ Search events by title or description
- ✅ Get events by user
- ✅ Advanced search with multiple criteria

### Data Storage
- ✅ Local JSON file storage (default)
- ✅ Extensible storage interface for database integration
- ✅ Automatic data directory creation
- ✅ Unique event IDs
- ✅ Timestamp tracking (created/updated)

### Security & Validation
- ✅ User ownership validation for updates/deletes
- ✅ Date/time validation
- ✅ Input sanitization
- ✅ Error handling and user feedback

## Usage Examples

### Creating an Event
```
/create-event title:"Team Meeting" description:"Weekly team sync" start_time:"2024-01-15 14:00" end_time:"2024-01-15 15:00" location:"Conference Room A"
```

### Listing Events
```
/list-events days:7
```

### Updating an Event
```
/update-event event_id:"abc123" title:"Updated Meeting Title" location:"New Location"
```

### Deleting an Event
```
/delete-event event_id:"abc123"
```

## Data Structure

Events are stored with the following structure:

```json
{
  "id": "unique_event_id",
  "title": "Event Title",
  "description": "Event description",
  "startTime": "2024-01-15T14:00:00.000Z",
  "endTime": "2024-01-15T15:00:00.000Z",
  "location": "Event Location",
  "createdBy": "discord_user_id",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

## Extending for Database Integration

The system is designed to be easily extensible for database integration. Here's how to add a new storage backend:

1. **Create a new storage class** that extends `StorageInterface`
2. **Implement all required methods** from the interface
3. **Update EventManager** to use your new storage backend

### Example: Using Database Storage

```javascript
const DatabaseStorage = require('./utilities/database_storage_example');
const EventManager = require('./utilities/event_manager');

// Configure database connection
const dbConfig = {
  host: 'localhost',
  user: 'username',
  password: 'password',
  database: 'events_db'
};

// Create storage backend
const dbStorage = new DatabaseStorage(dbConfig);

// Create event manager with database storage
const eventManager = new EventManager(dbStorage);
```

### Database Schema Example

```sql
CREATE TABLE events (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_time DATETIME NOT NULL,
  end_time DATETIME,
  location VARCHAR(255),
  created_by VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);
```

## File Structure

```
utilities/
├── event_manager.js           # Main event management interface
├── storage_interface.js       # Abstract storage interface
├── file_storage.js           # Local file storage implementation
└── database_storage_example.js # Example database storage

commands/calendar/
├── create-event.js           # Create event command
├── list-events.js            # List events command
├── update-event.js           # Update event command
├── delete-event.js           # Delete event command
└── events.js                 # Legacy events command (updated)

data/
└── events.json              # Local event storage file
```

## Migration from Google Calendar

The system has been completely decoupled from Google Calendar API:

- ❌ Removed Google Calendar dependencies
- ❌ Removed OAuth authentication requirements
- ❌ Removed external API calls
- ✅ Added local file storage
- ✅ Added extensible storage interface
- ✅ Maintained all existing functionality
- ✅ Added new features (CRUD operations)

## Benefits

1. **No External Dependencies** - No need for Google Calendar API setup
2. **Faster Performance** - Local storage eliminates API latency
3. **Offline Capability** - Works without internet connection
4. **Extensible** - Easy to integrate with databases
5. **User Control** - Users own their event data
6. **Privacy** - No data shared with external services

## Future Enhancements

- [ ] Database integration (PostgreSQL, MySQL, SQLite)
- [ ] Event categories/tags
- [ ] Recurring events
- [ ] Event reminders/notifications
- [ ] Event sharing between users
- [ ] Calendar export functionality
- [ ] Event templates
- [ ] Bulk operations 
