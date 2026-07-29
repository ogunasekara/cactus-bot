const { SlashCommandBuilder } = require("discord.js");
const EventManager = require("../../utilities/event_manager");
const {
  createEventListEmbed,
  createEventStatusEmbed,
} = require("../../utilities/event_embeds");

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
          const embed = createEventStatusEmbed({
            color: 0xff6b6b,
            title: "📅 No Events Found",
            description:
              "No events have been created yet. Use `/create-event` to create your first event!",
          });

          return await interaction.editReply({ embeds: [embed] });
        }

        // Show past events if no upcoming events found
        const now = new Date();
        const pastEvents = allEvents.filter(
          (event) => new Date(event.startTime) < now,
        );

        if (pastEvents.length > 0) {
          pastEvents.sort(
            (a, b) => new Date(b.startTime) - new Date(a.startTime),
          );

          const recentPastEvents = pastEvents.slice(0, 5);
          const embed = createEventListEmbed(recentPastEvents, {
            color: 0xffa500,
            title: "📅 No Upcoming Events",
            description: `No upcoming events found in the next ${daysAhead} days, but here are your past events:`,
            isPast: true,
            maxFields: 5,
          });

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

      // Sort events by start time
      events.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

      const embed = createEventListEmbed(events, {
        color: 0x0099ff,
        title: "📅 Upcoming Events",
        description: `Events in the next ${daysAhead} days:`,
      });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("Error listing events:", error);
      await interaction.editReply(
        "❌ An error occurred while fetching events. Please try again.",
      );
    }
  },
};
