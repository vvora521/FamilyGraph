# FamilyGraph

A knowledge-graph based family tree application for discovering, visualizing, and preserving family history. Built with Next.js, Neo4j, and AI-powered research agents.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Data Model](#data-model)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)

---

## Overview

FamilyGraph lets authenticated users build and explore a family tree stored as a property graph in Neo4j. Relationships such as parent–child and marriage are modelled as first-class graph edges, enabling rich queries (e.g. shortest path between two relatives). An integrated Claude-powered AI layer can automatically research historical context for individuals and label uploaded family photos.

---

## Features

| Feature | Description |
|---|---|
| **Interactive Family Tree** | Force-directed graph powered by `react-force-graph-2d`. Nodes are color-coded by birth decade. Click a node to open a detail side-panel. |
| **Geographic Map** | Mapbox-GL map showing where family members lived. Includes a timeline slider to filter by date range. |
| **People Directory** | Browse, search (full-text), add, and edit family members with birth/death dates, bio, gender, and photo. |
| **AI Research Agent** | Claude agent that queries existing graph data via tool-use and proposes historically relevant `Event` nodes for human review. |
| **AI Media Labelling** | Claude vision model automatically tags uploaded family photos (era, setting, number of people, occasion). |
| **Admin Review Queue** | All AI-suggested contributions queue as `PendingContribution` nodes and must be accepted or rejected by a human before they are written to the graph. |
| **Export** | Export the family tree as GEDCOM 5.5.1 (compatible with Ancestry, MyHeritage, etc.), JSON-LD (Schema.org / Wikidata), or PDF. |
| **Authentication & RBAC** | Clerk-powered sign-in / sign-up with role-based access control (`viewer`, `contributor`, `admin`). All routes are protected by Next.js middleware. |
| **Background Job Queue** | BullMQ + Redis (Upstash) workers run AI research and media-labelling jobs asynchronously. |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 15](https://nextjs.org) (App Router, React 19) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | [Neo4j](https://neo4j.com) (property graph) |
| Auth | [Clerk](https://clerk.com) |
| API | [tRPC v11](https://trpc.io) + [TanStack Query](https://tanstack.com/query) |
| AI | [Anthropic Claude](https://anthropic.com) via `@anthropic-ai/sdk` and LangChain |
| Media | [Cloudinary](https://cloudinary.com) |
| Maps | [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) |
| Graph UI | [react-force-graph-2d](https://github.com/vasturiano/react-force-graph) |
| Job Queue | [BullMQ](https://bullmq.io) + [ioredis](https://github.com/redis/ioredis) / Upstash Redis |
| Validation | [Zod](https://zod.dev) |

---

## Data Model

The Neo4j graph contains the following node labels and relationship types.

### Node Labels

| Label | Key Properties |
|---|---|
| `Person` | `id`, `name`, `birthDate`, `deathDate`, `bio`, `gender`, `birthPlace`, `cloudinaryPublicId` |
| `Event` | `id`, `title`, `description`, `date`, `eventType` |
| `Place` | `id`, `name`, `latitude`, `longitude`, `country`, `region` |
| `Media` | `id`, `cloudinaryPublicId`, `mediaType`, `caption`, `takenAt`, `aiLabels`, `aiLabelStatus` |
| `Source` | `id`, `title`, `url`, `description` |
| `Contributor` | `id`, `clerkUserId`, `role`, `name`, `email` |
| `PendingContribution` | `id`, `proposedData`, `status`, `agentId`, `createdBy` |

### Relationship Types

| Relationship | Meaning |
|---|---|
| `PARENT_OF` | Person → Person |
| `CHILD_OF` | Person → Person |
| `MARRIED_TO` | Person ↔ Person |
| `PARTICIPATED_IN` | Person → Event |
| `OCCURS_AT` | Event → Place |
| `APPEARS_IN` | Person → Media |
| `DOCUMENTS` | Source → Person / Event |
| `CONTRIBUTED_BY` | Person / Event → Contributor |
| `LIVES_AT` | Person → Place |

### Indexes

Full-text search indexes exist on `Person(name, bio)` and `Event(title, description)`. Regular indexes cover `Person(name)`, `Person(archived)`, `Event(date)`, and `Media(aiLabelStatus)`.

---

## Project Structure

```
.
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Landing page (sign-in / sign-up)
│   ├── dashboard/          # Main dashboard with feature cards
│   ├── tree/               # Interactive force-directed family tree
│   ├── map/                # Mapbox geographic view
│   ├── persons/            # People directory, add/edit forms
│   ├── admin/              # AI review queue
│   ├── export/             # GEDCOM, JSON-LD, and PDF export
│   ├── sign-in/            # Clerk sign-in page
│   ├── sign-up/            # Clerk sign-up page
│   └── api/                # API routes (tRPC, Cloudinary, webhooks)
├── components/
│   ├── graph/              # FamilyTree canvas component + PersonSidePanel
│   ├── map/                # GeographicMap Mapbox component
│   └── providers/          # React / tRPC providers
├── lib/
│   ├── trpc/               # tRPC client setup
│   ├── cloudinary/         # Cloudinary helpers
│   └── types/              # Shared TypeScript types and interfaces
├── server/
│   ├── neo4j/              # Neo4j driver, schema (Cypher), seed script
│   ├── routers/            # tRPC routers: persons, events, media, places, agents
│   ├── trpc/               # tRPC server context and middleware
│   ├── agents/             # AI agents: researchAgent, mediaLabelAgent
│   └── jobs/               # BullMQ queue definitions, Redis connection, workers
├── middleware.ts            # Clerk auth middleware (protects all non-public routes)
├── next.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- A running [Neo4j](https://neo4j.com/download/) instance (local or AuraDB)
- Redis instance (local or [Upstash](https://upstash.com))
- Accounts for: [Clerk](https://clerk.com), [Cloudinary](https://cloudinary.com), [Mapbox](https://mapbox.com), [Anthropic](https://anthropic.com)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/vvora521/FamilyGraph.git
cd FamilyGraph

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.local.example .env.local
# Fill in all values in .env.local (see below)

# 4. Initialise the Neo4j schema (run the Cypher statements in your Neo4j browser or CLI)
#    File: server/neo4j/schema.cypher

# 5. (Optional) Seed the database with sample data
npx tsx server/neo4j/seed.ts

# 6. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in the following values:

| Variable | Description |
|---|---|
| `NEO4J_URI` | Bolt URI for the Neo4j instance (e.g. `bolt://localhost:7687`) |
| `NEO4J_USERNAME` | Neo4j username |
| `NEO4J_PASSWORD` | Neo4j password |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name (client-side) |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox public access token |
| `ANTHROPIC_API_KEY` | Anthropic API key (used by AI agents) |
| `REDIS_URL` | Redis connection URL (Upstash or local) |
| `REDIS_TOKEN` | Redis token (required for Upstash) |
| `TAVILY_API_KEY` | Tavily search API key (used by research agent) |

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |

