import { db } from '../index'
import {
  teams,
  users,
  achievementPoints,
  rewards,
} from '../schema'

interface BaseData {
  branchID: { id: string }
  branchTH: { id: string }
  catBintang: { id: string }
  catPenalti: { id: string }
  catPoinAha: { id: string }
}

export async function seedDev(base: BaseData) {
  console.log('Seeding dev data...')

  const { branchID, branchTH, catBintang, catPenalti, catPoinAha } = base

  // 4 teams (3 Indonesia, 1 Thailand)
  const [teamOps, teamSales, teamHR, teamTH] = await db
    .insert(teams)
    .values([
      { branchId: branchID.id, name: 'Operations' },
      { branchId: branchID.id, name: 'Sales' },
      { branchId: branchID.id, name: 'Human Resources' },
      { branchId: branchTH.id, name: 'Bangkok Office' },
    ])
    .returning()

  console.log(`  Created ${4} teams`)

  // 20 users: admin x1, hr x2, leader x4, employee x13
  const userValues = [
    // Admin (no branch restriction in practice, assigned to ID)
    { branchId: branchID.id, teamId: null, email: 'admin@aha.com', name: 'System Admin', role: 'admin' as const, department: 'IT', position: 'Administrator', mustChangePassword: false },
    // HR x2
    { branchId: branchID.id, teamId: teamHR.id, email: 'hr.sari@aha.com', name: 'Sari Dewi', role: 'hr' as const, department: 'HR', position: 'HR Manager', mustChangePassword: false },
    { branchId: branchTH.id, teamId: teamTH.id, email: 'hr.somchai@aha.com', name: 'Somchai Prasert', role: 'hr' as const, department: 'HR', position: 'HR Coordinator', mustChangePassword: false },
    // Leader x4
    { branchId: branchID.id, teamId: teamOps.id, email: 'leader.budi@aha.com', name: 'Budi Santoso', role: 'leader' as const, department: 'Operations', position: 'Team Lead' },
    { branchId: branchID.id, teamId: teamSales.id, email: 'leader.ayu@aha.com', name: 'Ayu Lestari', role: 'leader' as const, department: 'Sales', position: 'Sales Lead' },
    { branchId: branchID.id, teamId: teamHR.id, email: 'leader.rina@aha.com', name: 'Rina Putri', role: 'leader' as const, department: 'HR', position: 'HR Lead' },
    { branchId: branchTH.id, teamId: teamTH.id, email: 'leader.niran@aha.com', name: 'Niran Chaiyasit', role: 'leader' as const, department: 'Operations', position: 'Team Lead' },
    // Employee x13
    { branchId: branchID.id, teamId: teamOps.id, email: 'emp.doni@aha.com', name: 'Doni Prasetya', role: 'employee' as const, department: 'Operations', position: 'Staff' },
    { branchId: branchID.id, teamId: teamOps.id, email: 'emp.wati@aha.com', name: 'Wati Suryani', role: 'employee' as const, department: 'Operations', position: 'Staff' },
    { branchId: branchID.id, teamId: teamOps.id, email: 'emp.hendra@aha.com', name: 'Hendra Wijaya', role: 'employee' as const, department: 'Operations', position: 'Staff' },
    { branchId: branchID.id, teamId: teamSales.id, email: 'emp.mega@aha.com', name: 'Mega Sari', role: 'employee' as const, department: 'Sales', position: 'Sales Rep' },
    { branchId: branchID.id, teamId: teamSales.id, email: 'emp.fajar@aha.com', name: 'Fajar Rahman', role: 'employee' as const, department: 'Sales', position: 'Sales Rep' },
    { branchId: branchID.id, teamId: teamSales.id, email: 'emp.indah@aha.com', name: 'Indah Permata', role: 'employee' as const, department: 'Sales', position: 'Sales Rep' },
    { branchId: branchID.id, teamId: teamHR.id, email: 'emp.yuni@aha.com', name: 'Yuni Astuti', role: 'employee' as const, department: 'HR', position: 'HR Assistant' },
    { branchId: branchID.id, teamId: teamHR.id, email: 'emp.agus@aha.com', name: 'Agus Hermawan', role: 'employee' as const, department: 'HR', position: 'HR Assistant' },
    { branchId: branchTH.id, teamId: teamTH.id, email: 'emp.kanya@aha.com', name: 'Kanya Thongchai', role: 'employee' as const, department: 'Operations', position: 'Staff' },
    { branchId: branchTH.id, teamId: teamTH.id, email: 'emp.prawit@aha.com', name: 'Prawit Suksai', role: 'employee' as const, department: 'Operations', position: 'Staff' },
    { branchId: branchTH.id, teamId: teamTH.id, email: 'emp.arisa@aha.com', name: 'Arisa Rattana', role: 'employee' as const, department: 'Operations', position: 'Staff' },
    { branchId: branchTH.id, teamId: teamTH.id, email: 'emp.tanakorn@aha.com', name: 'Tanakorn Wongsa', role: 'employee' as const, department: 'Operations', position: 'Staff' },
    { branchId: branchID.id, teamId: teamOps.id, email: 'emp.rizki@aha.com', name: 'Rizki Maulana', role: 'employee' as const, department: 'Operations', position: 'Staff' },
  ]

  const createdUsers = await db.insert(users).values(userValues).returning()
  console.log(`  Created ${createdUsers.length} users`)

  // Set team leaders
  const leaderBudi = createdUsers.find((u) => u.email === 'leader.budi@aha.com')!
  const leaderAyu = createdUsers.find((u) => u.email === 'leader.ayu@aha.com')!
  const leaderRina = createdUsers.find((u) => u.email === 'leader.rina@aha.com')!
  const leaderNiran = createdUsers.find((u) => u.email === 'leader.niran@aha.com')!

  const { eq } = await import('drizzle-orm')
  await Promise.all([
    db.update(teams).set({ leaderId: leaderBudi.id }).where(eq(teams.id, teamOps.id)),
    db.update(teams).set({ leaderId: leaderAyu.id }).where(eq(teams.id, teamSales.id)),
    db.update(teams).set({ leaderId: leaderRina.id }).where(eq(teams.id, teamHR.id)),
    db.update(teams).set({ leaderId: leaderNiran.id }).where(eq(teams.id, teamTH.id)),
  ])

  console.log('  Assigned team leaders')

  // Helper to find users by role/branch
  const idEmployees = createdUsers.filter(
    (u) => u.role === 'employee' && u.branchId === branchID.id,
  )
  const thEmployees = createdUsers.filter(
    (u) => u.role === 'employee' && u.branchId === branchTH.id,
  )
  const idLeaders = [leaderBudi, leaderAyu, leaderRina]
  const hrSari = createdUsers.find((u) => u.email === 'hr.sari@aha.com')!
  const hrSomchai = createdUsers.find((u) => u.email === 'hr.somchai@aha.com')!

  // 50 sample achievement points
  const pointValues: Array<{
    branchId: string
    userId: string
    categoryId: string
    points: number
    reason: string
    status: 'active' | 'pending'
    submittedBy: string
    kittaComponent?: string
  }> = []

  // 20 Bintang (active, submitted by leaders/HR)
  for (let i = 0; i < 15; i++) {
    const emp = idEmployees[i % idEmployees.length]
    const submitter = i % 3 === 0 ? hrSari : idLeaders[i % idLeaders.length]
    pointValues.push({
      branchId: branchID.id,
      userId: emp.id,
      categoryId: catBintang.id,
      points: 1,
      reason: `${emp.name} berkontribusi dalam project milestone ${i + 1}`,
      status: 'active',
      submittedBy: submitter.id,
    })
  }
  for (let i = 0; i < 5; i++) {
    const emp = thEmployees[i % thEmployees.length]
    pointValues.push({
      branchId: branchTH.id,
      userId: emp.id,
      categoryId: catBintang.id,
      points: 1,
      reason: `${emp.name} contributed to quarterly target achievement`,
      status: 'active',
      submittedBy: i % 2 === 0 ? leaderNiran.id : hrSomchai.id,
    })
  }

  // 10 Penalti (active, submitted by leaders/HR)
  const kittaCodes = ['K', 'I', 'T1', 'T2', 'A'] as const
  for (let i = 0; i < 8; i++) {
    const emp = idEmployees[i % idEmployees.length]
    const submitter = i % 2 === 0 ? hrSari : idLeaders[i % idLeaders.length]
    pointValues.push({
      branchId: branchID.id,
      userId: emp.id,
      categoryId: catPenalti.id,
      points: (i % 3) + 1,
      reason: `${emp.name} melanggar SOP ${kittaCodes[i % 5]} sehingga mengganggu operasional`,
      status: 'active',
      submittedBy: submitter.id,
      kittaComponent: kittaCodes[i % 5],
    })
  }
  for (let i = 0; i < 2; i++) {
    const emp = thEmployees[i % thEmployees.length]
    pointValues.push({
      branchId: branchTH.id,
      userId: emp.id,
      categoryId: catPenalti.id,
      points: 1,
      reason: `${emp.name} violated attendance policy`,
      status: 'active',
      submittedBy: leaderNiran.id,
      kittaComponent: 'K',
    })
  }

  // 15 Poin AHA (active, submitted by leaders/HR)
  for (let i = 0; i < 12; i++) {
    const emp = idEmployees[i % idEmployees.length]
    const submitter = i % 3 === 0 ? hrSari : idLeaders[i % idLeaders.length]
    pointValues.push({
      branchId: branchID.id,
      userId: emp.id,
      categoryId: catPoinAha.id,
      points: (i % 5) + 1,
      reason: `${emp.name} berpartisipasi dalam training session ${i + 1}`,
      status: 'active',
      submittedBy: submitter.id,
    })
  }
  for (let i = 0; i < 3; i++) {
    const emp = thEmployees[i % thEmployees.length]
    pointValues.push({
      branchId: branchTH.id,
      userId: emp.id,
      categoryId: catPoinAha.id,
      points: (i % 3) + 2,
      reason: `${emp.name} participated in team building event`,
      status: 'active',
      submittedBy: hrSomchai.id,
    })
  }

  // 5 pending self-submissions
  for (let i = 0; i < 5; i++) {
    const emp = idEmployees[i % idEmployees.length]
    pointValues.push({
      branchId: branchID.id,
      userId: emp.id,
      categoryId: catBintang.id,
      points: 1,
      reason: `${emp.name} berkontribusi dalam inisiatif improvement ${i + 1}`,
      status: 'pending',
      submittedBy: emp.id,
    })
  }

  await db.insert(achievementPoints).values(pointValues)
  console.log(`  Created ${pointValues.length} achievement points`)

  // 5 rewards
  await db.insert(rewards).values([
    { branchId: null, name: 'Kaos AHA Exclusive', description: 'Limited edition AHA branded t-shirt', pointCost: 50 },
    { branchId: null, name: 'Voucher Makan 100K', description: 'Voucher makan senilai Rp 100.000', pointCost: 30 },
    { branchId: branchID.id, name: 'Half-Day Off', description: 'Setengah hari libur tambahan', pointCost: 100 },
    { branchId: branchID.id, name: 'Parking Spot VIP (1 bulan)', description: 'Tempat parkir VIP selama 1 bulan', pointCost: 75 },
    { branchId: branchTH.id, name: 'Grab Voucher 500 THB', description: 'Grab food/ride voucher', pointCost: 40 },
  ])

  console.log('  Created 5 rewards')
}
