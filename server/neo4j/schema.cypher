// Unique constraints
CREATE CONSTRAINT person_id IF NOT EXISTS FOR (p:Person) REQUIRE p.id IS UNIQUE;
CREATE CONSTRAINT event_id IF NOT EXISTS FOR (e:Event) REQUIRE e.id IS UNIQUE;
CREATE CONSTRAINT place_id IF NOT EXISTS FOR (pl:Place) REQUIRE pl.id IS UNIQUE;
CREATE CONSTRAINT media_id IF NOT EXISTS FOR (m:Media) REQUIRE m.id IS UNIQUE;
CREATE CONSTRAINT source_id IF NOT EXISTS FOR (s:Source) REQUIRE s.id IS UNIQUE;
CREATE CONSTRAINT contributor_id IF NOT EXISTS FOR (c:Contributor) REQUIRE c.id IS UNIQUE;
CREATE CONSTRAINT contributor_clerk_id IF NOT EXISTS FOR (c:Contributor) REQUIRE c.clerkUserId IS UNIQUE;
CREATE CONSTRAINT pending_id IF NOT EXISTS FOR (pc:PendingContribution) REQUIRE pc.id IS UNIQUE;

// Full-text search indexes
CREATE FULLTEXT INDEX person_fulltext IF NOT EXISTS FOR (p:Person) ON EACH [p.name, p.bio];
CREATE FULLTEXT INDEX event_fulltext IF NOT EXISTS FOR (e:Event) ON EACH [e.title, e.description];

// Regular indexes for common lookups
CREATE INDEX person_name IF NOT EXISTS FOR (p:Person) ON (p.name);
CREATE INDEX person_archived IF NOT EXISTS FOR (p:Person) ON (p.archived);
CREATE INDEX event_date IF NOT EXISTS FOR (e:Event) ON (e.date);
CREATE INDEX media_ai_status IF NOT EXISTS FOR (m:Media) ON (m.aiLabelStatus);
