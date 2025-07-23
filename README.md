# Sync Messages Example

This is a Next.js application that demonstrates how to integrate with various messaging platforms using Integration.app. The app allows you to view messages and chats from multiple connected integrations in a unified chat interface.

## Features

- **Multi-Platform Message Sync**: Connect to multiple messaging platforms and view all messages in one place
- **Real-time Chat Interface**: Modern chat UI with message bubbles, timestamps, and sender information
- **Chat Management**: Browse and select different chats from connected platforms
- **Integration Dashboard**: Overview of connected platforms and message statistics
- **Dark Mode Support**: Full dark/light theme support
- **Responsive Design**: Works on desktop and mobile devices
- **MongoDB Integration**: Efficient data storage and caching for better performance
- **Robust Timestamp Handling**: Proper conversion of Slack and other platform timestamps

## Pages

### Overview (`/`)

- Dashboard showing integration status and quick stats
- Overview of connected platforms and recent activity

### Integrations (`/integrations`)

- Connect to messaging platforms via Integration.app
- Manage your connected integrations
- View integration status and configuration

### Messages (`/messages`)

- **Main feature**: Unified chat interface for all connected messaging platforms
- View messages from all integrations in a chat format
- Browse and select different chats
- Real-time message updates (refreshes every 30 seconds)
- Message statistics and platform information
- Sync functionality to fetch fresh data from integrations
- Platform badges showing source of each message/chat

## API Endpoints

### `/api/messages`

- `GET`: Fetch messages from MongoDB (fast, cached data)
- Returns messages with sender, content, timestamp, and platform source

### `/api/chats`

- `GET`: Fetch chats from MongoDB (fast, cached data)
- Returns chat information including participants and last message

### `/api/messages/sync`

- `POST`: Sync messages and chats from all connected integrations to MongoDB
- Fetches fresh data from Integration.app and stores it locally

### `/api/integration-token`

- `POST`: Generate integration tokens for platform connections

### `/api/self`

- `GET`: Get current user information

## Integration.app Actions

The app uses the following Integration.app actions to fetch data:

- `get-messages`: Retrieves messages from connected platforms with parameters:
  - `cursor`: Pagination cursor (empty string for first page)
  - `channelId`: Channel/chat ID to fetch messages from
- `get-chats`: Retrieves chat/conversation lists from connected platforms

### Data Structure Handling

The application properly handles various platform data structures:

- **Slack timestamps**: Converts Unix timestamps (e.g., `"1753303953.454369"`) to ISO format
- **Message content**: Extracts from `fields.text`, `rawFields.text`, or other platform-specific fields
- **Sender information**: Extracts from `fields.ownerId`, `rawFields.user`, or other sender fields

## Technologies Used

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **SWR**: Data fetching and caching
- **Integration.app SDK**: Platform integration
- **MongoDB**: Data storage (via Mongoose)
- **date-fns**: Date formatting utilities
- **Lucide React**: Icon library
- **@chatscope/chat-ui-kit-react**: Chat UI components and interface

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set up your environment variables:

   ```bash
   cp .env.example .env.local
   ```

3. Configure your Integration.app credentials in `.env.local`

4. Run the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) (or the port shown in your terminal) in your browser

## Usage

1. **Connect Integrations**: Go to the Integrations page and connect your messaging platforms
2. **Sync Messages**: Click "Sync Messages" to fetch fresh data from all connected platforms
3. **View Messages**: Navigate to the Messages page to see all your messages
4. **Browse Chats**: Select different chats from the sidebar to view conversations
5. **Refresh Data**: Use the refresh button to update the display from cached data
6. **Platform Information**: See which platform each message/chat comes from via badges

## Architecture

The application follows a clean architecture pattern:

- **API Routes**: Handle server-side logic and Integration.app communication
- **Database Models**: MongoDB schemas for messages and chats with proper indexing
- **Hooks**: Custom React hooks for data fetching (SWR-based)
- **Components**: Reusable UI components for chat interface
- **Types**: TypeScript interfaces for type safety
- **Utils**: Helper functions and utilities including timestamp conversion

## Customization

You can customize the chat interface by:

- Modifying the `ChatMessage` component for different message styles
- Updating the `ChatList` component for different chat list layouts
- Adding new Integration.app actions for additional functionality
- Extending the message and chat types for platform-specific data
- Customizing timestamp handling in `src/lib/utils.ts`
- Adding new platform integrations by extending the sync logic

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
