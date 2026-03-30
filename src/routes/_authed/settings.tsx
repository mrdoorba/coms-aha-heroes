import { createFileRoute, useRouter } from '@tanstack/react-router'
import * as m from '~/paraglide/messages'
import { useState } from 'react'
import { Settings, AlertTriangle, Save, Globe, Tag } from 'lucide-react'
import { listSettingsFn, updateSettingFn } from '~/server/functions/settings'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'

export const Route = createFileRoute('/_authed/settings')({
  loader: async () => {
    const settings = await listSettingsFn()
    return { settings }
  },
  component: SettingsPage,
  pendingComponent: SettingsSkeleton,
})

function SettingsSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 pt-6 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded bg-muted" />
        <div className="h-6 w-32 rounded bg-muted" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-40 rounded-xl border border-gray-100 bg-white" />
      ))}
    </div>
  )
}

const BRANCHES = [
  { name: 'Indonesia', timezone: 'Asia/Jakarta (GMT+7)', flag: '🇮🇩' },
  { name: 'Thailand', timezone: 'Asia/Bangkok (GMT+7)', flag: '🇹🇭' },
]

const POINT_CATEGORIES = [
  { name: 'Bintang sAHAbat', type: 'bintang', active: true },
  { name: 'Penalti', type: 'penalti', active: true },
  { name: 'Poin AHA', type: 'poin_aha', active: true },
]

function SettingsPage() {
  const { settings } = Route.useLoaderData()
  const { session } = Route.useRouteContext()
  const router = useRouter()

  const role = session?.appUser?.role ?? 'employee'

  if (role !== 'admin') {
    return (
      <div className="mx-auto max-w-2xl p-4 pt-10 text-center">
        <div className="rounded-xl border border-red-200 bg-red-50 p-8">
          <Settings className="mx-auto mb-3 h-10 w-10 text-red-400" />
          <h2 className="text-lg font-semibold text-red-700">{m.common_access_denied()}</h2>
          <p className="mt-1 text-sm text-red-500">
            {m.settings_admin_only()}
          </p>
        </div>
      </div>
    )
  }

  const findValue = (key: string, fallback: number) => {
    if (!Array.isArray(settings)) return fallback
    const entry = (settings as { key: string; value: unknown }[]).find(
      (s) => s.key === key,
    )
    return entry !== undefined ? Number(entry.value) : fallback
  }

  return <SettingsForm findValue={findValue} router={router} />
}

type RouterType = ReturnType<typeof useRouter>

function SettingsForm({
  findValue,
  router,
}: {
  findValue: (key: string, fallback: number) => number
  router: RouterType
}) {
  const [bintangImpact, setBintangImpact] = useState(
    findValue('bintang_impact', 10),
  )
  const [penaltiImpact, setPenaltiImpact] = useState(
    findValue('penalti_impact', -5),
  )
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleSaveImpacts = async () => {
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    try {
      await Promise.all([
        updateSettingFn({
          data: { key: 'bintang_impact', value: bintangImpact },
        }),
        updateSettingFn({
          data: { key: 'penalti_impact', value: penaltiImpact },
        }),
      ])
      setSaveSuccess(true)
      router.invalidate()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 pb-24 pt-6 md:pb-8">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6 text-[#1D388B]" />
        <h1 className="text-xl font-bold text-[#1D388B]">{m.settings_title()}</h1>
      </div>

      {/* Section 1: Point Impact Values */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-[#1D388B]">
          {m.settings_point_impact()}
        </h2>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="bintang-impact" className="text-sm font-medium">
              {m.settings_bintang_impact()}
            </Label>
            <Input
              id="bintang-impact"
              type="number"
              value={bintangImpact}
              onChange={(e) => setBintangImpact(Number(e.target.value))}
              className="w-full rounded-xl"
              placeholder="+10"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="penalti-impact" className="text-sm font-medium">
              {m.settings_penalti_impact()}
            </Label>
            <Input
              id="penalti-impact"
              type="number"
              value={penaltiImpact}
              onChange={(e) => setPenaltiImpact(Number(e.target.value))}
              className="w-full rounded-xl"
              placeholder="-5"
            />
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 rounded-xl bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
            <span>
              {m.settings_impact_warning()}
            </span>
          </div>

          {/* Feedback */}
          {saveError && (
            <p className="text-sm text-red-600">{saveError}</p>
          )}
          {saveSuccess && (
            <p className="text-sm text-green-600">{m.settings_saved()}</p>
          )}

          <Button
            onClick={handleSaveImpacts}
            disabled={saving}
            className="w-full rounded-xl bg-[#325FEC] text-white hover:bg-[#1D388B]"
          >
            <Save className="mr-1.5 h-4 w-4" />
            {saving ? m.settings_saving() : m.common_save()}
          </Button>
        </div>
      </div>

      {/* Section 2: Branch Management */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Globe className="h-4 w-4 text-[#1D388B]" />
          <h2 className="text-sm font-semibold text-[#1D388B]">
            {m.settings_branch_management()}
          </h2>
        </div>

        <ul className="space-y-2">
          {BRANCHES.map((branch) => (
            <li
              key={branch.name}
              className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3"
            >
              <span className="text-sm font-medium">
                {branch.flag} {branch.name}
              </span>
              <span className="text-xs text-gray-500">{branch.timezone}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Section 3: Point Categories */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Tag className="h-4 w-4 text-[#1D388B]" />
          <h2 className="text-sm font-semibold text-[#1D388B]">
            {m.settings_point_categories()}
          </h2>
        </div>

        <ul className="space-y-2">
          {POINT_CATEGORIES.map((cat) => (
            <li
              key={cat.type}
              className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3"
            >
              <span className="text-sm font-medium">{cat.name}</span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  cat.active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {cat.active ? m.status_active() : m.status_inactive()}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
