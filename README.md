
# SwiftTrack Inventory

SwiftTrack Inventory is a smart inventory management system designed to streamline tracking, analysis, and reporting of inventory items. It leverages QR code scanning for quick item identification and provides a comprehensive dashboard with real-time analytics.

## Core Features

-   **QR Code Scanning**: Easily scan QR codes using the device's camera to log and identify inventory items.
-   **Inventory Dashboard**: View detailed information about items, including quantity, location, status, expiry dates, and ABC analysis categorization.
-   **Automated Alerts**: Receive notifications for low stock levels and items nearing their expiration dates.
-   **ABC Analysis**: Prioritize inventory items based on their consumption value (Category A, B, C).
-   **Dead Stock Identification**: Identify slow-moving or non-moving inventory to optimize stock levels and reduce waste.
-   **Analytics Dashboard**: Visualize key inventory metrics like stock turnover rate, sales velocity, and carrying costs with interactive charts.
-   **Customizable Reports**: Generate reports on profit margins, stock aging, and supplier performance. (Download functionality is simulated in the current version).
-   **QR Code Generation**: A utility to generate QR codes for new items, including details like ID, name, expiry date, unit cost, unit price, supplier ID, and purchase date.
-   **Predicted Top Sellers**: A (currently simulated) feature on the dashboard to highlight products predicted to sell well.
-   **Dark/Light Mode**: Toggle between light and dark themes for user preference.

## Technologies Used

-   **Frontend**:
    -   Next.js (App Router)
    -   React
    -   TypeScript
-   **Styling**:
    -   Tailwind CSS
    -   ShadCN UI (for UI components)
    -   Lucide Icons (for iconography)
-   **Charting**:
    -   Recharts
-   **QR Code Handling**:
    -   `html5-qrcode` (for scanning)
    -   `qrcode.react` (for generation)
-   **State Management**: React Hooks (useState, useEffect, useContext)
-   **Linting & Formatting**: ESLint, Prettier (implicitly via Next.js setup)
-   **GenAI (Planned/Potential)**:
    -   Genkit (for potential future AI-driven features like advanced demand forecasting, anomaly detection, or natural language querying)

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

-   Node.js (v18.x or later recommended)
-   npm or yarn

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd swifttrack-inventory
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Environment Variables (if any):**
    Create a `.env.local` file in the root directory if you need to set environment variables (e.g., API keys for future Genkit integration). For example:
    ```
    GOOGLE_GENAI_API_KEY=YOUR_API_KEY_HERE
    ```

### Running the Application

1.  **Development Mode:**
    To run the app in development mode with hot-reloading:
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    The application will typically be available at `http://localhost:9002`.

2.  **Production Build:**
    To build the application for production:
    ```bash
    npm run build
    # or
    yarn build
    ```

3.  **Start Production Server:**
    To serve the production build:
    ```bash
    npm run start
    # or
    yarn start
    ```

## Available Scripts

-   `dev`: Runs the app in development mode (`next dev --turbopack -p 9002`).
-   `genkit:dev`: Starts Genkit in development mode (if Genkit flows are implemented).
-   `genkit:watch`: Starts Genkit in development mode with file watching.
-   `build`: Creates a production build of the application.
-   `start`: Starts the production server.
-   `lint`: Lints the codebase using Next.js's built-in ESLint configuration.
-   `typecheck`: Runs TypeScript type checking.

## Folder Structure

```
swifttrack-inventory/
├── components/             # Reusable UI components (ShadCN and custom)
│   ├── ui/                 # ShadCN UI primitives
│   └── *.tsx               # Custom application components (e.g., QrScanner, InventoryDashboard)
├── src/
│   ├── ai/                 # Genkit related files (flows, prompts)
│   │   ├── flows/
│   │   └── *.ts
│   ├── app/                # Next.js App Router: pages, layouts, global styles
│   │   ├── (routes)/       # Route groups and pages
│   │   ├── globals.css     # Global styles and Tailwind directives
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Main application page
│   ├── hooks/              # Custom React hooks (e.g., useToast, useMobile)
│   ├── lib/                # Utility functions, type definitions
│   │   ├── inventory-utils.ts # Business logic for inventory (e.g., ABC analysis)
│   │   ├── types.ts        # Shared TypeScript type definitions
│   │   └── utils.ts        # General utility functions (e.g., cn for Tailwind)
├── public/                 # Static assets
├── .env.local              # Local environment variables (not committed)
├── next.config.ts          # Next.js configuration
├── package.json            # Project dependencies and scripts
├── tailwind.config.ts      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

## Key Components

-   **`src/app/page.tsx`**: The main entry point of the application, orchestrating the layout and different views.
-   **`src/components/qr-scanner.tsx`**: Handles QR code scanning using the device camera.
-   **`src/components/qr-code-generator.tsx`**: Allows users to generate QR codes for inventory items.
-   **`src/components/inventory-dashboard.tsx`**: Displays an overview of all inventory items, their status, and (simulated) predicted top sellers.
-   **`src/components/notifications.tsx`**: Shows alerts for low stock and expiring items.
-   **`src/components/abc-analysis-view.tsx`**: Visualizes inventory items categorized by ABC analysis.
-   **`src/components/dead-stock-view.tsx`**: Lists items that are considered dead stock based on inactivity.
-   **`src/components/analytics-dashboard.tsx`**: Provides charts and KPIs for inventory analytics.
-   **`src/components/reports-view.tsx`**: Allows users to view and (simulate) download various inventory reports.
-   **`src/components/ui/sidebar.tsx`**: A reusable, responsive sidebar component.
-   **`src/components/theme-toggle.tsx`**: Allows users to switch between light and dark themes.

## Style Guidelines

-   **Primary Color**: Clean white or light grey for backgrounds.
-   **Secondary Color**: Muted blue (`#4682B4`) for headers and primary interactive elements.
-   **Accent Color**: Bright teal (`#008080`) for key actions and alerts.
-   **Font**: Open Sans or Roboto for readability.
-   **Icons**: Minimalistic icons from Lucide React.
-   **Layout**: Responsive grid layout.
-   **UI Components**: Styled with ShadCN UI and Tailwind CSS, featuring rounded corners and subtle shadows for a professional look.

## Future Enhancements (Potential)

-   User authentication and authorization.
-   Persistent data storage (e.g., Firebase Firestore, Supabase).
-   Full Genkit integration for AI-powered predictions, demand forecasting, or anomaly detection.
-   Backend implementation for report generation and automated emailing.
-   Integration with e-commerce platforms or ERP systems.
-   Batch operations and bulk editing of inventory items.
-   More sophisticated ML models for predictions.

## Contributing

Contributions are welcome! Please follow standard coding practices and ensure your changes pass linting and type checks.

(If a formal contribution guide is needed, it can be added here or as a separate `CONTRIBUTING.md` file.)

---

This README provides an overview of the SwiftTrack Inventory application. For more detailed information on specific components or functionalities, please refer to the source code and inline documentation.
