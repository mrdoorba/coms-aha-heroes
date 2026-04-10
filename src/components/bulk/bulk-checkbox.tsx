type BulkCheckboxProps = {
  readonly checked: boolean
  readonly onChange: () => void
  readonly indeterminate?: boolean
}

export function BulkCheckbox({ checked, onChange, indeterminate }: BulkCheckboxProps) {
  return (
    <input
      type="checkbox"
      checked={checked}
      ref={(el) => {
        if (el) el.indeterminate = indeterminate ?? false
      }}
      onChange={onChange}
      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
    />
  )
}
