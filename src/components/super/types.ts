export interface InstitutionRow {
  id: number
  name: string
  code: string
  status: 'draft' | 'active' | 'inactive'
  cryptoWalletsEnabled: boolean
}

export interface InstitutionCreditPool {
  institutionId: number
  allocatedCredits: number
  utilizedCredits: number
  remainingCredits: number
}

export interface NgoRow {
  id: number
  name: string
  code: string
  status: boolean
}
