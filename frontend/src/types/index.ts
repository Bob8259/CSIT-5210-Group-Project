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

