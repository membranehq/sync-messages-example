# Integration Use Case Template

This is a template for an application showcasing integration capabilities using [Integration.app](https://integration.app). The app is built with Next.js and demonstrates how to implement user authentication and integration token generation.

## Prerequisites

- Node.js 18+ installed
- Integration.app workspace credentials (Workspace Key and Secret)

## Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd <repository-name>
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Set up environment variables:

```bash
# Copy the sample environment file
cp .env-sample .env
```

4. Edit `.env` and add your Integration.app credentials:

```env
INTEGRATION_APP_WORKSPACE_KEY=your_workspace_key_here
INTEGRATION_APP_WORKSPACE_SECRET=your_workspace_secret_here
```

You can find these credentials in your Integration.app workspace settings.

## Running the Application

1. Start the development server:

```bash
npm run dev
# or
yarn dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `/src/app` - Next.js app router pages and API routes
- `/src/components` - Reusable React components
- `/src/lib` - Utility functions and helpers
- `/public` - Static assets

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint to check code quality

## License

MIT
