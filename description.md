# Realtime Full Two-Way Sync of Messages

This scenario enables your application to fully sync Messages between your app and any external application in both directions. It handles the initial import/export of Messages and then sends events when a Message is created, updated, or deleted on any side, as close to real-time as possible.

Message fields will be mapped from your application's schema to the application-specific schema using Integration.app's Universal Data Model.

## How It Works

### 1. Initial Sync

- **Import Messages**: Perform the initial import by calling the Integration.app REST API or SDK in a loop from your code to retrieve data page by page. Integration.app transforms the output into a consistent format compatible with your API, allowing you to save and match data efficiently.
- **Export Messages**: Make another set of requests to create Messages in external app, if needed.
- **User Platform Mapping**: Store mappings between your internal customer IDs and external platform user IDs/emails to correctly identify message senders and recipients.
- **User ID Fetching**: Integration.app fetches user IDs during the initial sync process, ensuring proper user identification when sending messages and maintaining accurate sender/recipient mapping across all platforms.

### 2. Continuous Sync from External App

- **Webhook Subscription**: Enable subscription via a single API or SDK call to continuously receive created, updated, or deleted events from external applications.
- **Integration.app Management**: Integration.app manages all integration-specific logic, including subscribing to/unsubscribing from webhooks, custom polling of events, or performing periodic full syncs.
- **Real-time Events**: You will only receive the necessary events as real-time as supported by the external application's API.
- **Smart Integration Detection**: Extract integration information from UserPlatform records using customerId + platformName instead of relying on webhook payload.

### 3. Continuous Sync from Your App

- **Webhook URI**: You will get a single webhook URI that you will use to send events about created, updated, or deleted Messages to Integration.app.
- **Automatic Mapping**: Once sent, Integration.app will map the webhook payload to the format supported by external application and send the correct request.

## Universal Message Handling

**Email threads and emails are handled the same way as chat channels and direct messages.** This unified approach means:

- **Email Threads = Chat Channels**: Each email conversation thread is treated as a chat channel, allowing you to manage email discussions alongside team chats and direct messages.
- **Individual Emails = Messages**: Each email within a thread is treated as a message, maintaining the conversation flow and threading structure.
- **Consistent Interface**: Whether you're working with Slack channels, Gmail threads, Teams conversations, or WhatsApp chats, the same interface and workflow applies.
- **Cross-Platform Conversations**: You can seamlessly switch between email threads and chat conversations, with all messages appearing in a unified timeline.

This design enables true unified messaging where email and chat communications are treated as equal participants in your messaging ecosystem.

## Getting Started

1. **Connect Integrations**: Use the integrations dialog to connect your messaging platforms
2. **Import Chats**: Select and import conversations from connected platforms
3. **Sync Messages**: Perform initial message synchronization
4. **Real-time Updates**: Receive and send messages in real-time through webhooks

The system automatically handles the complexity of different platform APIs, user identification, and data synchronization while providing a consistent, real-time messaging experience across all supported platforms.

## Live Demo

**See this implementation in action:** [https://sync-messages-example.vercel.app/messages](https://sync-messages-example.vercel.app/messages)

Experience the real-time two-way message sync with live integrations, chat management, and unified messaging interface across multiple platforms.
