'use client'

const DAY_NAMES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

export default function ThisWeekStrip() {
  const now = new Date()
  const todayIndex = now.getDay() // 0=Sun 1=Mon...6=Sat

  const monday = new Date(now)
  monday.setDate(now.getDate() - ((todayIndex + 6) % 7))

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })

  const isWeekend = (i: number) => i === 5 || i === 6

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-sm font-medium text-gray-900">This week</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {weekDays[0].toLocaleDateString('default', { day: 'numeric', month: 'short' })}
          {' – '}
          {weekDays[6].toLocaleDateString('default', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>
      <div className="grid grid-cols-7 gap-2 p-4">
        {weekDays.map((day, i) => {
          const isToday = day.toDateString() === now.toDateString()
          const weekend = isWeekend(i)

          return (
            <div
              key={i}
              className={`rounded-lg p-3 text-center flex flex-col items-center gap-1
                ${isToday
                  ? 'bg-green-50 border border-green-200'
                  : weekend
                  ? 'bg-amber-50/40 border border-amber-100'
                  : 'bg-gray-50 border border-gray-100'}
              `}
            >
              <p className={`text-xs font-medium uppercase tracking-wide
                ${isToday ? 'text-green-700' : weekend ? 'text-amber-600' : 'text-gray-400'}`}>
                {DAY_NAMES[i]}
              </p>
              <p className={`text-lg font-semibold leading-none
                ${isToday ? 'text-green-700' : 'text-gray-700'}`}>
                {day.getDate()}
              </p>
              <p className="text-xs text-gray-400">
                {isToday ? 'Today' : weekend ? 'Off' : '—'}
              </p>
              <div className={`w-1.5 h-1.5 rounded-full mt-0.5
                ${isToday ? 'bg-green-500' : 'bg-gray-200'}`}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
