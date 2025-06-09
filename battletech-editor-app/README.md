# Battletech Editor App

This is a [Next.js](https://nextjs.org) project for editing and managing Battletech game data, bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

The application uses an SQLite database (`battletech_dev.sqlite`) for data storage. This database is generated from source JSON files by the `populate_db.py` script located in the `battletech-editor-app/data/` directory.

**Docker Builds:**
When building the Docker image for this application, the `populate_db.py` script is run automatically to create and populate a fresh `battletech_dev.sqlite` database within the image.

**Local Development:**
If you are running the application locally (outside of Docker) and need to generate or update the database:

1.  Ensure you have Python 3 installed.
2.  Navigate to the `battletech-editor-app/data/` directory:
    ```bash
    cd battletech-editor-app/data
    ```
3.  Run the population script:
    ```bash
    python3 populate_db.py
    ```
    This will create or update the `battletech_dev.sqlite` file in the `battletech-editor-app/data/` directory. This file is ignored by Git (as per `.gitignore` settings).

The `populate_db.py` script has been optimized with batch processing to improve database generation speed.

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
