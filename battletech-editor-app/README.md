# Battletech Editor App

This is a Next.js application for editing and managing Battletech game data.

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

### Installation

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd battletech-editor-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Development Server

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

The application will be running in development mode with hot-reload enabled, meaning any changes you make to the code will be reflected immediately in the browser.

### Available Scripts

- `npm run dev` - Starts the development server
- `npm run build` - Creates a production build
- `npm run start` - Runs the production build
- `npm run lint` - Runs ESLint to check code quality

### Database Setup

The application uses SQLite for data storage. Make sure the `battletech_dev.sqlite` file is present in the root directory. If you need to initialize the database, refer to the data population scripts in the `data/` directory.

## Project Structure

- `src/` - Contains the main application source code
- `components/` - Reusable React components
- `pages/` - Next.js pages and API routes
- `public/` - Static files
- `services/` - Backend services and utilities
- `types/` - TypeScript type definitions

## Technologies Used

- Next.js 15.3.3
- React 18.2.0
- TypeScript
- SQLite
