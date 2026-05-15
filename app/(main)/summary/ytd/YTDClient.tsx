'use client'

import { formatMoney } from '@/lib/currency'

interface MonthData {
  month: number
  name: string
  shortName: string
  normalPay: number
  otPay: number
  food: number
  total: number
  hasPaylaws: boolean
}

interface Props {
  monthlyData: MonthData[]
  year: number
  currency: string
}

export default function YTDClient({ monthlyData, year, currency }: Props) {
  const maxTotal = Math.max(...monthlyData.map(m => m.total), 1)
  const hasAnyData = monthlyData.some(m => m.total > 0)

  if (!hasAnyData) return null

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5">
      <p className="text-xs font-semibold text-gray-400 uppercase
                    tracking-wider mb-1 flex items-center gap-3
                    after:flex-1 after:h-px after:bg-gray-100
                    after:content-['']">
        Monthly spending — {year}
      </p>

      <div className="flex items-center gap-4 mb-5 text-xs text-gray-500
                      flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-green-400 inline-block"/>
          Normal pay
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-amber-400 inline-block"/>
          Overtime
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-red-300 inline-block"/>
          Expenses
        </span>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-2 h-40">
        {monthlyData.map(m => {
          const normalH = maxTotal > 0
            ? (m.normalPay / maxTotal) * 100
            : 0
          const otH = maxTotal > 0
            ? (m.otPay / maxTotal) * 100
            : 0
          const foodH = maxTotal > 0
            ? (m.food / maxTotal) * 100
            : 0

          return (
            <div
              key={m.month}
              className="flex-1 flex flex-col items-center gap-1 group"
            >
              {/* Tooltip on hover */}
              {m.total > 0 && (
                <div className="hidden group-hover:block absolute
                                bg-gray-900 text-white text-xs rounded-lg
                                px-2 py-1.5 -translate-y-1 whitespace-nowrap
                                z-10 pointer-events-none">
                  <p className="font-semibold">{m.name}</p>
                  {m.normalPay > 0 && (
                    <p className="text-green-300">
                      Normal: {formatMoney(m.normalPay, currency)}
                    </p>
                  )}
                  {m.otPay > 0 && (
                    <p className="text-amber-300">
                      OT: {formatMoney(m.otPay, currency)}
                    </p>
                  )}
                  {m.food > 0 && (
                    <p className="text-red-300">
                      Exp: {formatMoney(m.food, currency)}
                    </p>
                  )}
                  <p className="font-bold border-t border-white/20 mt-1 pt-1">
                    Total: {formatMoney(m.total, currency)}
                  </p>
                </div>
              )}

              {/* Stacked bar */}
              <div className="relative w-full flex flex-col justify-end
                              h-32 gap-0">
                {/* Expenses */}
                {foodH > 0 && (
                  <div
                    className="w-full bg-red-300 rounded-t-sm
                               transition-all duration-500"
                    style={{ height: `${foodH}%` }}
                  />
                )}
                {/* OT */}
                {otH > 0 && (
                  <div
                    className="w-full bg-amber-400 transition-all
                               duration-500"
                    style={{ height: `${otH}%` }}
                  />
                )}
                {/* Normal */}
                {normalH > 0 && (
                  <div
                    className={`w-full bg-green-400 transition-all
                                duration-500
                      ${otH === 0 && foodH === 0
                        ? 'rounded-t-sm'
                        : ''}`}
                    style={{ height: `${normalH}%` }}
                  />
                )}
                {/* Empty bar placeholder */}
                {m.total === 0 && (
                  <div className="w-full bg-gray-100 rounded-sm h-1"/>
                )}
              </div>

              {/* Month label */}
              <span className={`text-xs font-medium
                ${m.total > 0 ? 'text-gray-600' : 'text-gray-300'}`}>
                {m.shortName}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}