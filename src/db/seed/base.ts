import { db } from '../index'
import { branches, pointCategories, pointCategoryTranslations, systemSettings } from '../schema'

export async function seedBase() {
  console.log('Seeding base data...')

  // 2 branches
  const [branchID, branchTH] = await db
    .insert(branches)
    .values([
      { code: 'ID', name: 'Indonesia', timezone: 'Asia/Jakarta', locale: 'id' },
      { code: 'TH', name: 'Thailand', timezone: 'Asia/Bangkok', locale: 'th' },
    ])
    .returning()

  console.log(`  Created branches: ${branchID.code}, ${branchTH.code}`)

  // 3 point categories
  const [catBintang, catPenalti, catPoinAha] = await db
    .insert(pointCategories)
    .values([
      {
        code: 'BINTANG',
        defaultName: 'Poin Bintang sAHAbat',
        description: 'Positive recognition for contributions',
        icon: 'star',
        requiresScreenshot: true,
      },
      {
        code: 'PENALTI',
        defaultName: 'Poin Penalti Staff AHA',
        description: 'Rule violation penalty with severity tracking',
        icon: 'alert-triangle',
        requiresScreenshot: true,
      },
      {
        code: 'POIN_AHA',
        defaultName: 'Poin AHA',
        description: 'Direct AHA points for participation',
        icon: 'award',
        requiresScreenshot: false,
      },
    ])
    .returning()

  console.log(`  Created ${3} point categories`)

  // Category translations (id, en, th)
  await db.insert(pointCategoryTranslations).values([
    // Bintang
    { categoryId: catBintang.id, locale: 'id', name: 'Poin Bintang sAHAbat', description: 'Pengakuan kontribusi positif' },
    { categoryId: catBintang.id, locale: 'en', name: 'Star Points', description: 'Positive contribution recognition' },
    { categoryId: catBintang.id, locale: 'th', name: 'คะแนนดาว', description: 'การยอมรับผลงานเชิงบวก' },
    // Penalti
    { categoryId: catPenalti.id, locale: 'id', name: 'Poin Penalti Staff AHA', description: 'Pelanggaran aturan' },
    { categoryId: catPenalti.id, locale: 'en', name: 'Penalty Points', description: 'Rule violation penalty' },
    { categoryId: catPenalti.id, locale: 'th', name: 'คะแนนลงโทษ', description: 'การลงโทษการละเมิดกฎ' },
    // Poin AHA
    { categoryId: catPoinAha.id, locale: 'id', name: 'Poin AHA', description: 'Poin partisipasi langsung' },
    { categoryId: catPoinAha.id, locale: 'en', name: 'AHA Points', description: 'Direct participation points' },
    { categoryId: catPoinAha.id, locale: 'th', name: 'คะแนน AHA', description: 'คะแนนการมีส่วนร่วมโดยตรง' },
  ])

  console.log(`  Created ${9} category translations`)

  // System settings defaults
  await db.insert(systemSettings).values([
    {
      key: 'bintang_point_impact',
      value: 10,
      description: 'Points added to Poin AHA per Bintang',
    },
    {
      key: 'penalti_point_impact',
      value: 5,
      description: 'Points deducted from Poin AHA per Penalti point',
    },
  ])

  console.log('  Created system settings defaults')

  return { branchID, branchTH, catBintang, catPenalti, catPoinAha }
}
