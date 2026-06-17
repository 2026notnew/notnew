export type Category =
  | 'rock-posters'
  | 'automotive'
  | 'petroliana'
  | 'garage-tools'
  | 'motorcycles'
  | 'watches'

export type SourceSite =
  | 'ebay'
  | 'etsy'
  | 'craigslist'
  | 'facebook'
  | 'hamb'
  | 'garage-journal'
  | 'other'

export type FindStatus = 'pending' | 'approved' | 'rejected'

export type UserRole = 'user' | 'moderator' | 'admin'

export interface User {
  id: string
  email: string
  username: string
  role: UserRole
  createdAt: Date
}

export interface Find {
  id: string
  url: string
  title: string
  description: string
  price: number | null
  sourceSite: SourceSite
  images: string[]
  category: Category
  eraTag: string | null
  submittedBy: string
  featured: boolean
  status: FindStatus
  score: number
  createdAt: Date
}

export interface Comment {
  id: string
  findId: string
  userId: string
  body: string
  parentId: string | null
  createdAt: Date
  user?: Pick<User, 'username'>
}

export interface Vote {
  findId: string
  userId: string
  value: 1 | -1
}

export type FlagReason =
  | 'already-sold'
  | 'not-vintage'
  | 'under-100'
  | 'spam'
  | 'wrong-category'
  | 'broken-link'
  | 'other'

export interface Flag {
  id: string
  findId: string
  userId: string
  reason: FlagReason
  notes: string | null
  status: 'open' | 'resolved'
  createdAt: Date
}
