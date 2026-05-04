'use client'

interface Option {
  month: number
  year: number
  label: string
}

interface Props {
  options: Option[]
  currentMonth: number
  currentYear: number
}

export default function MonthSelector({
  options,
  currentMonth,
  currentYear,
}: Props) {
  return (
    <select
      defaultValue={`${currentMonth}-${currentYear}`}
      onChange={e => {
        const [m, y] = e.target.value.split('-')
        const url = new URL(window.location.href)
        url.searchParams.set('month', m)
        url.searchParams.set('year', y)
        window.location.href = url.toString()
      }}
      className="border border-gray-200 rounded-lg px-3 py-2 text-sm
                 outline-none focus:border-gray-400 bg-white"
    >
      {options.map(opt => (
        <option
          key={`${opt.month}-${opt.year}`}
          value={`${opt.month}-${opt.year}`}
        >
          {opt.label}
        </option>
      ))}
    </select>
  )
}