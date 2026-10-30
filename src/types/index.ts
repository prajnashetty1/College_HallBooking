export type Role = 'student' | 'faculty' | 'admin'
export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'
export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled'

export interface Profile {
  id: string
  full_name: string
  email: string
  role: Role
  department: string | null
  avatar_url: string | null
  created_at: string
}

export interface Hall {
  id: string
  name: string
  description: string | null
  capacity: number
  location: string
  image_url: string | null
  facilities: string[]
  is_active: boolean
  created_at: string
}

export interface Booking {
  id: string
  hall_id: string
  user_id: string
  title: string
  description: string | null
  event_date: string
  start_time: string
  end_time: string
  status: BookingStatus
  admin_notes: string | null
  created_at: string
  hall?: Hall
  user?: Profile
}

export interface CollegeEvent {
  id: string
  title: string
  description: string | null
  hall_id: string | null
  event_date: string
  start_time: string | null
  end_time: string | null
  status: EventStatus
  created_by: string | null
  created_at: string
  hall?: Hall
}

export interface AppNotification {
  id: string
  user_id: string
  title: string
  message: string | null
  type: string | null
  is_read: boolean
  link: string | null
  created_at: string
}

export interface MaintenanceRecord {
  id: string
  hall_id: string
  title: string
  description: string | null
  scheduled_date: string
  start_time: string | null
  end_time: string | null
  status: MaintenanceStatus
  created_at: string
  hall?: Hall
}

export interface AuditLog {
  id: string
  actor_id: string | null
  action: string
  table_name: string | null
  record_id: string | null
  details: Record<string, unknown> | null
  created_at: string
}
