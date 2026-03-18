import { memo, useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { BANTEN_KOTA_KABUPATEN, TIPE_PROPERTI, TIPE_SEWA } from '../../constants'

export interface FilterValues {
  search:    string
  kota:      string
  tipe:      string
  tipeSewa:  string
  hargaMin:  string
  hargaMax:  string
}

interface FilterBarProps {
  onFilter: (values: FilterValues) => void
}

const defaultFilter: FilterValues = {
  search:   '',
  kota:     '',
  tipe:     '',
  tipeSewa: '',
  hargaMin: '',
  hargaMax: '',
}

const FilterBar = memo<FilterBarProps>(({ onFilter }) => {
  const [values, setValues]       = useState<FilterValues>(defaultFilter)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleChange = (key: keyof FilterValues, value: string) => {
    const updated = { ...values, [key]: value }
    setValues(updated)
    onFilter(updated)
  }

  const handleReset = () => {
    setValues(defaultFilter)
    onFilter(defaultFilter)
  }

  const hasFilter = Object.values(values).some(v => v !== '')

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      {/* Search + Toggle */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="Cari nama kost, alamat..."
            leftIcon={<Search size={16} />}
            value={values.search}
            onChange={e => handleChange('search', e.target.value)}
          />
        </div>
        <Button
          variant={showAdvanced ? 'secondary' : 'outline'}
          size="md"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <SlidersHorizontal size={16} />
          <span className="hidden sm:inline">Filter</span>
        </Button>
        {hasFilter && (
          <Button variant="ghost" size="md" onClick={handleReset}>
            <X size={16} />
          </Button>
        )}
      </div>

      {/* Advanced Filter */}
      {showAdvanced && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-slate-100">
          {/* Kota */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Kota/Kabupaten</label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={values.kota}
              onChange={e => handleChange('kota', e.target.value)}
            >
              <option value="">Semua Wilayah</option>
              {BANTEN_KOTA_KABUPATEN.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          {/* Tipe Properti */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Tipe</label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={values.tipe}
              onChange={e => handleChange('tipe', e.target.value)}
            >
              <option value="">Semua Tipe</option>
              {TIPE_PROPERTI.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Tipe Sewa */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Durasi Sewa</label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={values.tipeSewa}
              onChange={e => handleChange('tipeSewa', e.target.value)}
            >
              <option value="">Semua Durasi</option>
              {TIPE_SEWA.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Harga */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Harga Maks (Rp)</label>
            <input
              type="number"
              placeholder="contoh: 50000"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={values.hargaMax}
              onChange={e => handleChange('hargaMax', e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  )
})

FilterBar.displayName = 'FilterBar'
export default FilterBar
 
