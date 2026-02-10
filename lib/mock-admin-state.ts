import { PoliticalPrisoner, PrisonersByOrganization, ReadingRoomItem } from '@/types'
import { mockPoliticalPrisoners, mockPrisonersByOrg, mockReadingRoom } from '@/data/mock'

// In-memory state for mock mode admin operations
// This data resets on server restart and is not persisted
class MockAdminState {
  private prisoners: PoliticalPrisoner[] = []
  private prisonersByOrg: PrisonersByOrganization[] = []
  private readingRoom: ReadingRoomItem[] = []
  private initialized = false

  private initialize() {
    if (this.initialized) return

    // Deep clone mock data to avoid mutating original
    this.prisoners = JSON.parse(JSON.stringify(mockPoliticalPrisoners))
    this.prisonersByOrg = JSON.parse(JSON.stringify(mockPrisonersByOrg))
    this.readingRoom = JSON.parse(JSON.stringify(mockReadingRoom))
    this.initialized = true
  }

  // Political Prisoners
  getAllPrisoners(): PoliticalPrisoner[] {
    this.initialize()
    return [...this.prisoners]
  }

  createPrisoner(data: Omit<PoliticalPrisoner, 'id' | 'created_at' | 'updated_at'>): PoliticalPrisoner {
    this.initialize()
    const newPrisoner: PoliticalPrisoner = {
      id: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    this.prisoners.push(newPrisoner)
    return newPrisoner
  }

  updatePrisoner(id: string, data: Partial<PoliticalPrisoner>): PoliticalPrisoner | null {
    this.initialize()
    const index = this.prisoners.findIndex(p => p.id === id)
    if (index === -1) return null

    this.prisoners[index] = {
      ...this.prisoners[index],
      ...data,
      id: this.prisoners[index].id, // Preserve ID
      updated_at: new Date().toISOString(),
    }
    return this.prisoners[index]
  }

  deletePrisoner(id: string): boolean {
    this.initialize()
    const index = this.prisoners.findIndex(p => p.id === id)
    if (index === -1) return false

    this.prisoners.splice(index, 1)
    return true
  }

  // Prisoners by Organization
  getAllPrisonersByOrg(): PrisonersByOrganization[] {
    this.initialize()
    return [...this.prisonersByOrg]
  }

  createPrisonerByOrg(data: Omit<PrisonersByOrganization, 'id' | 'created_at' | 'updated_at'>): PrisonersByOrganization {
    this.initialize()
    const newRecord: PrisonersByOrganization = {
      id: `mock-org-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    this.prisonersByOrg.push(newRecord)
    return newRecord
  }

  updatePrisonerByOrg(id: string, data: Partial<PrisonersByOrganization>): PrisonersByOrganization | null {
    this.initialize()
    const index = this.prisonersByOrg.findIndex(p => p.id === id)
    if (index === -1) return null

    this.prisonersByOrg[index] = {
      ...this.prisonersByOrg[index],
      ...data,
      id: this.prisonersByOrg[index].id,
      updated_at: new Date().toISOString(),
    }
    return this.prisonersByOrg[index]
  }

  deletePrisonerByOrg(id: string): boolean {
    this.initialize()
    const index = this.prisonersByOrg.findIndex(p => p.id === id)
    if (index === -1) return false

    this.prisonersByOrg.splice(index, 1)
    return true
  }

  // Reading Room
  getAllReadingRoom(): ReadingRoomItem[] {
    this.initialize()
    return [...this.readingRoom]
  }

  createReadingRoomItem(data: Omit<ReadingRoomItem, 'id' | 'created_at'>): ReadingRoomItem {
    this.initialize()
    const newItem: ReadingRoomItem = {
      id: `mock-reading-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      created_at: new Date().toISOString(),
    }
    this.readingRoom.push(newItem)
    return newItem
  }

  updateReadingRoomItem(id: string, data: Partial<ReadingRoomItem>): ReadingRoomItem | null {
    this.initialize()
    const index = this.readingRoom.findIndex(r => r.id === id)
    if (index === -1) return null

    this.readingRoom[index] = {
      ...this.readingRoom[index],
      ...data,
      id: this.readingRoom[index].id,
    }
    return this.readingRoom[index]
  }

  deleteReadingRoomItem(id: string): boolean {
    this.initialize()
    const index = this.readingRoom.findIndex(r => r.id === id)
    if (index === -1) return false

    this.readingRoom.splice(index, 1)
    return true
  }

  // Reset all state (useful for testing)
  reset() {
    this.prisoners = []
    this.prisonersByOrg = []
    this.readingRoom = []
    this.initialized = false
  }
}

// Singleton instance
export const mockAdminState = new MockAdminState()
