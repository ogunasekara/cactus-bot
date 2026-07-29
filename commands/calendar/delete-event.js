const { SlashCommandBuilder } = require("discord.js");
const EventManager = require("../../utilities/event_manager");
const { createEventActionEmbed } = require("../../utilities/event_embeds");

const eventManager = new EventManager();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("delete-event")
    .setDescription("Delete an existing event")
    .addStringOption((option) =>
      option
        .setName("event_id")
        .setDescription("The ID of the event to delete")
        .setRequired(true),
    ),
  async execute(interaction) {
    await interaction.deferReply();

    try {
      const eventId = interaction.options.getString("event_id");

      // Check if event exists
      const existingEvent = await eventManager.getEventById(eventId);
      if (!existingEvent) {
        return await interaction.editReply(
          "❌ Event not found. Please check the event ID.",
        );
      }

      // Check if user is the creator of the event
      if (existingEvent.createdBy !== interaction.user.id) {
        return await interaction.editReply(
          "❌ You can only delete events that you created.",
        );
      }

      // Delete the event
      const deletedEvent = await eventManager.deleteEvent(eventId);

      const embed = createEventActionEmbed(deletedEvent, {
        color: 0xff6b6b,
        title: "🗑️ Event Deleted Successfully",
      });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("Error deleting event:", error);
      await interaction.editReply(
        "❌ An error occurred while deleting the event. Please try again.",
      );
    }
  },
};
