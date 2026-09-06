# Spotlight

> **Disclaimer:** This is an unofficial portfolio project built strictly for demonstration purposes. It is not affiliated with, endorsed by, or connected to any commercial ticketing vendor or live event platform.

Spotlight is a concert discovery and ticketing app built with a Ruby on Rails backend, a React frontend, and a Python assistant service. It includes an embedded AI chatbot that helps users find concerts by location, artist, or specific date ranges.

---

## Previews

<div align="center">

### Home Dashboard

![Spotlight Home Dashboard](./screenshots/ss1.png)
_Browse upcoming concerts, featured artists, and venues._

<br/>

### Event Details & Seat Selector

![Event Details & Seat Selector](./screenshots/ss2.png)
_View seating maps, ticket options, and availability._

<br/>

### AI Assistant Chatbot

<table align="center">
  <tr>
    <td align="center">
      <img src="./screenshots/ss3.png" alt="AI Chatbot Assistant View 1" width="400"/><br/>
      <sub><i>Chatbot location search response</i></sub>
    </td>
    <td align="center">
      <img src="./screenshots/ss4.png" alt="AI Chatbot Assistant View 2" width="400"/><br/>
      <sub><i>Chatbot artist query response</i></sub>
    </td>
  </tr>
</table>

_Ask questions like "What is the closest concert to California?" or "Any shows next month?"._

</div>

---

## Features

- **AI Concert Assistant**:
  - **Location & Geolocation**: Finds nearest concerts to a given city or state with distance calculations in kilometers and miles.
  - **Date & Range Search**: Understands queries like "next month", "this weekend", "October", or specific years.
  - **Fallback Handling**: Recommends upcoming shows when a requested date window or region has no scheduled events.
- **Rails Backend**: Handles core API requests, user authentication, event catalogs, and orders.
- **React Frontend**: Interactive interface for browsing events, choosing seats, and talking to the chatbot.
- **Vector Search & PostGIS/pgvector**: PostgreSQL database setup for semantic event retrieval and location data.

---

## Project Structure

```
spotlight-main/
├── frontend/               # React + TypeScript + Vite UI
├── backend/
│   ├── my-rails-server/    # Ruby on Rails 8 API
│   └── ai-chatbot/         # FastAPI assistant service (Groq LLM, pgvector)
```

| Component        | Stack                                     |
| ---------------- | ----------------------------------------- |
| **Frontend**     | React 18, TypeScript, Vite, Tailwind CSS  |
| **Backend API**  | Ruby on Rails 8, Puma, PostgreSQL         |
| **AI Assistant** | Python 3.10+, FastAPI, Groq API, pgvector |
| **Database**     | PostgreSQL with `pgvector` extension      |

---

## Getting Started

### Prerequisites

- Ruby 3.x and Bundler
- Node.js 18+ and npm
- Python 3.10+ and pip
- PostgreSQL with `pgvector` extension installed

---

### 1. Database Setup

Create the PostgreSQL database and enable the vector extension:

```sql
CREATE DATABASE spotlight_development;
\c spotlight_development;
CREATE EXTENSION IF NOT EXISTS vector;
```

---

### 2. Rails Server Setup

```bash
cd backend/my-rails-server

# Install dependencies
bundle install

# Run database migrations and setup
bin/rails db:prepare

# Start Rails server on port 3000
bundle exec rails server -p 3000
```

---

### 3. AI Assistant Setup

```bash
cd backend/ai-chatbot

# Create and activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Ingest event data and venue coordinates
python ingest.py
python backfill_venue_coords.py

# Start FastAPI server on port 8000
python main.py
```

---

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

---

## License

Distributed under the MIT License.
