const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const EventManager = require("../../utilities/event_manager");

const eventManager = new EventManager();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("events")
    .setDescription("Returns a list of upcoming events.")
    .addIntegerOption((option) =>
      option
        .setName("days")
        .setDescription("Number of days ahead to show (default: 14)")
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(365),
    ),
  async execute(interaction) {
    await interaction.deferReply();

    try {
      const daysAhead = interaction.options.getInteger("days") || 14;
      const events = await eventManager.getUpcomingEvents(daysAhead);

      if (events.length === 0) {
        // Check if there are any events at all
        const allEvents = await eventManager.getAllEvents();

        if (allEvents.length === 0) {
          const embed = new EmbedBuilder()
            .setColor(0xff6b6b)
            .setTitle("📅 No Events Found")
            .setDescription(
              "No events have been created yet. Use `/create-event` to create your first event!",
            )
            .setTimestamp()
            .setFooter({ text: "Event System" });

          return await interaction.editReply({ embeds: [embed] });
        } else {
          // Show past events if no upcoming events found
          const now = new Date();
          const pastEvents = allEvents.filter(
            (event) => new Date(event.startTime) < now,
          );

          if (pastEvents.length > 0) {
            const embed = new EmbedBuilder()
              .setColor(0xffa500)
              .setTitle("📅 No Upcoming Events")
              .setDescription(
                `No upcoming events found in the next ${daysAhead} days, but here are your past events:`,
              )
              .setTimestamp()
              .setFooter({ text: "Event System" });

            // Sort past events by start time (most recent first)
            pastEvents.sort(
              (a, b) => new Date(b.startTime) - new Date(a.startTime),
            );

            // Show up to 5 most recent past events
            const recentPastEvents = pastEvents.slice(0, 5);
            for (const event of recentPastEvents) {
              const startDate = new Date(event.startTime);
              const formattedDate =
                startDate.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                }) +
                " @ " +
                startDate.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

              let eventInfo = `📅 ${formattedDate} (Past)`;
              if (event.location) {
                eventInfo += `\n📍 ${event.location}`;
              }
              if (event.description) {
                eventInfo += `\n📝 ${event.description.substring(0, 100)}${event.description.length > 100 ? "..." : ""}`;
              }
              eventInfo += `\n🆔 ${event.id}`;

              embed.addFields({
                name: event.title,
                value: eventInfo,
                inline: false,
              });
            }

            if (pastEvents.length > 5) {
              embed.addFields({
                name: "Note",
                value: `Showing 5 most recent past events. Total past events: ${pastEvents.length}`,
                inline: false,
              });
            }

            return await interaction.editReply({ embeds: [embed] });
          }
        }
      }

      // Sort events by start time
      events.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle("📅 Upcoming Events")
        .setDescription(`Events in the next ${daysAhead} days:`)
        .setTimestamp()
        .setFooter({ text: "Event System" });

      // Add event fields (Discord limits to 25 fields)
      const maxEvents = Math.min(events.length, 25);
      for (let i = 0; i < maxEvents; i++) {
        const event = events[i];
        const startDate = new Date(event.startTime);
        const formattedDate =
          startDate.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          }) +
          " @ " +
          startDate.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          });

        let eventInfo = `📅 ${formattedDate}`;
        if (event.location) {
          eventInfo += `\n📍 ${event.location}`;
        }
        if (event.description) {
          eventInfo += `\n📝 ${event.description.substring(0, 100)}${event.description.length > 100 ? "..." : ""}`;
        }
        eventInfo += `\n🆔 ${event.id}`;

        embed.addFields({
          name: event.title,
          value: eventInfo,
          inline: false,
        });
      }

      if (events.length > 25) {
        embed.addFields({
          name: "Note",
          value: `Showing first 25 events. Total events found: ${events.length}`,
          inline: false,
        });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("Error listing events:", error);
      await interaction.editReply(
        "❌ An error occurred while fetching events. Please try again.",
      );
    }
  },
};
