export type Role = 'viewer' | 'contributor' | 'admin'

export interface PersonNode {
  id: string
  name: string
  birthDate?: string
  deathDate?: string
  bio?: string
  gender?: 'male' | 'female' | 'other'
  birthPlace?: string
  cloudinaryPublicId?: string
  archived?: boolean
  createdAt: string
  updatedAt: string
}

export interface EventNode {
  id: string
  title: string
  description?: string
  date?: string
  eventType: string
  archived?: boolean
  createdAt: string
}

export interface PlaceNode {
  id: string
  name: string
  latitude?: number
  longitude?: number
  country?: string
  region?: string
  createdAt: string
}

export interface MediaNode {
  id: string
  cloudinaryPublicId: string
  mediaType: 'image' | 'video'
  caption?: string
  takenAt?: string
  aiLabels?: string[]
  aiLabelStatus?: 'pending' | 'complete' | 'none'
  createdAt: string
}

export interface SourceNode {
  id: string
  title: string
  url?: string
  description?: string
  createdAt: string
}

export interface ContributorNode {
  id: string
  clerkUserId: string
  role: Role
  name: string
  email: string
  createdAt: string
}

export interface PendingContributionNode {
  id: string
  proposedData: string
  status: 'pending' | 'accepted' | 'rejected'
  agentId: string
  createdBy: string
  reviewedBy?: string
  reviewedAt?: string
  createdAt: string
}

export type RelationshipType =
  | 'PARENT_OF'
  | 'CHILD_OF'
  | 'MARRIED_TO'
  | 'PARTICIPATED_IN'
  | 'OCCURS_AT'
  | 'APPEARS_IN'
  | 'DOCUMENTS'
  | 'CONTRIBUTED_BY'
  | 'LIVES_AT'

export const VALID_RELATIONSHIP_TYPES: RelationshipType[] = [
  'PARENT_OF',
  'CHILD_OF',
  'MARRIED_TO',
  'PARTICIPATED_IN',
  'OCCURS_AT',
  'APPEARS_IN',
  'DOCUMENTS',
  'CONTRIBUTED_BY',
  'LIVES_AT',
]

export interface GraphNode {
  id: string
  label: string
  type: 'Person' | 'Event' | 'Place' | 'Media' | 'Source'
  data: PersonNode | EventNode | PlaceNode | MediaNode | SourceNode
  x?: number
  y?: number
}

export interface GraphLink {
  source: string
  target: string
  type: RelationshipType
}

export interface FamilyGraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}
