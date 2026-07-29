const { EmbedBuilder } = require("discord.js");

/**
 * Format an event start time for display in event listings.
 */
function formatEventDate(startTime) {
  const startDate = new Date(startTime);
  const dateStr = startDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeStr = startDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${dateStr} @ ${timeStr}`;
}

/**
 * Build the informational value string for an event field.
 */
function buildEventFieldValue(event, options = {}) {
  const { isPast = false, includeId = true } = options;
  let value = `📅 ${formatEventDate(event.startTime)}${isPast ? " (Past)" : ""}`;

  if (event.location) {
    value += `\n📍 ${event.location}`;
  }
  if (event.description) {
    const snippet = event.description.substring(0, 100);
    const suffix = event.description.length > 100 ? "..." : "";
    value += `\n📝 ${snippet}${suffix}`;
  }
  if (includeId) {
    value += `\n🆔 ${event.id}`;
  }

  return value;
}

/**
 * Add the standard core fields (title, start time, event ID) to an embed.
 */
function addEventCoreFields(embed, event) {
  embed.addFields(
    { name: "Title", value: event.title, inline: true },
    {
      name: "Start Time",
      value: new Date(event.startTime).toLocaleString(),
      inline: true,
    },
    { name: "Event ID", value: event.id, inline: true },
  );
}

/**
 * Add optional event detail fields (description, end time, location).
 */
function addEventDetailFields(embed, event) {
  if (event.description) {
    embed.addFields({
      name: "Description",
      value: event.description,
      inline: false,
    });
  }
  if (event.endTime) {
    embed.addFields({
      name: "End Time",
      value: new Date(event.endTime).toLocaleString(),
      inline: true,
    });
  }
  if (event.location) {
    embed.addFields({
      name: "Location",
      value: event.location,
      inline: true,
    });
  }
}

/**
 * Create an embed for a single event action response (create/update/delete).
 */
function createEventActionEmbed(event, options = {}) {
  const {
    color = 0x00ff00,
    title = "✅ Event Updated Successfully",
    includeTimestamp = true,
  } = options;

  const embed = new EmbedBuilder().setColor(color).setTitle(title);
  addEventCoreFields(embed, event);
  addEventDetailFields(embed, event);

  if (includeTimestamp) {
    embed.setTimestamp();
  }

  return embed;
}

/**
 * Create an embed listing multiple events.
 */
function createEventListEmbed(events, options = {}) {
  const {
    color = 0x0099ff,
    title = "📅 Upcoming Events",
    description = "",
    isPast = false,
    maxFields = 25,
  } = options;

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp()
    .setFooter({ text: "Event System" });

  const displayEvents = events.slice(0, maxFields);
  for (const event of displayEvents) {
    embed.addFields({
      name: event.title,
      value: buildEventFieldValue(event, { isPast }),
      inline: false,
    });
  }

  if (events.length > maxFields) {
    embed.addFields({
      name: "Note",
      value: `Showing first ${maxFields} events. Total events found: ${events.length}`,
      inline: false,
    });
  }

  return embed;
}

/**
 * Create a simple status embed (e.g. empty state messages).
 */
function createEventStatusEmbed(options = {}) {
  const {
    color = 0xff6b6b,
    title = "📅 No Events Found",
    description = "No events have been created yet.",
  } = options;

  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp()
    .setFooter({ text: "Event System" });
}

module.exports = {
  formatEventDate,
  buildEventFieldValue,
  addEventCoreFields,
  addEventDetailFields,
  createEventActionEmbed,
  createEventListEmbed,
  createEventStatusEmbed,
};
