# Prime Inventory: Your Ultimate Warframe Prime Inventory Manager

## Overview

Prime Inventory is a dedicated Single Page Application (SPA) meticulously crafted to empower Warframe players with a seamless and intuitive platform for managing their Prime parts collection. Designed for optimal performance and user privacy, this application operates entirely offline, storing all user data locally within the browser. This ensures a fast, secure, and highly personal inventory management experience without reliance on external servers.

## Core Capabilities

- **Comprehensive Inventory Visualization:** Gain immediate clarity on your Prime parts. Our intuitive interface provides a real-time overview of your current holdings versus the required components for each Prime set.
- **Mastery Progression Tracking:** Effortlessly mark and monitor your mastered Prime sets, ensuring you always know your progress towards completing your collection.
- **Intelligent Crafting Readiness:** The application intelligently analyzes your inventory, automatically highlighting Prime sets that are ready for crafting based on your available parts.
- **Streamlined Inventory Actions:** Execute common inventory tasks with ease. Dedicated actions for "Build" and "Sell" sets automatically adjust your part counts, simplifying your management workflow.
- **Advanced Filtering and Search:** Quickly locate specific Prime sets using a robust search function or apply detailed filters based on category, completion status, or mastery level.
- **Secure Data Management (Import/Export):** Maintain full control over your inventory data. Export your entire collection to a JSON file for secure backup and effortlessly restore it whenever needed.
- **Insightful Inventory Statistics:** Access a concise summary of your collection's status, including total parts acquired and the number of completed sets, providing valuable insights into your progress.
- **Uninterrupted Offline Access:** Enjoy complete functionality even without an internet connection. All data processing and storage occur client-side, guaranteeing continuous access to your inventory.

## Tech Stack

- **Framework:** Next.js 15+ (App Router)
- **Language:** JavaScript (ES6+)
- **Styling:** Tailwind CSS
- **Warframe Data Integration:** `@wfcd/items` package
- **Local Data Storage:** `localStorage` (100% client-side)
- **State Management:** React Context API with `useState` and `useReducer`

<!-- TODO: Poner website
## Website

Explore Prime Inventory in action and learn more about its features at:
[https://www.primeinventoryapp.com](https://www.primeinventoryapp.com) (Placeholder - will be updated with the official link) -->

## Getting Started

To set up and run Prime Inventory locally, follow these simple steps:

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/umbra-code/prime-inventory.git
    cd prime-inventory
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

Once the server is running, open [http://localhost:3000](http://localhost:3000) in your web browser to access the application.

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.
