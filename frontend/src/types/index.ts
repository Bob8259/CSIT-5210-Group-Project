export interface User {
  id: string
  name: string
  email: string
  bio?: string
  preferred_causes: string[]
  target_populations: string[]
  preferred_regions: string[]
  skills: string[]
  max_duration_hours?: number | null
  has_preferences: boolean
  profile_text?: string
}

export interface PreferenceForm {
  preferred_causes: string[]
  target_populations: string[]
  preferred_regions: string[]
  skills: string[]
  max_duration_hours: number
  bio?: string
}

export interface MetadataOptions {
  issue_areas: string[]
  target_populations: string[]
  regions: string[]
  skills: string[]
}

export interface EventItem {
  id: string
  url: string
  title: string
  organization_name?: string
  organization_website?: string
  issue_areas: string[]
  populations_served: string[]
  required_skills: string[]
  location_address?: string
  region?: string
  event_date?: string
  start_datetime?: string
  end_datetime?: string
  duration_hours?: number | null
  description?: string
}

export interface EventListResponse {
  total: number
  page: number
  page_size: number
  items: EventItem[]
}


