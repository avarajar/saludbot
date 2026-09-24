'use client';

import type { BusinessHours } from '@/types';

const DAY_LABELS: Record<keyof BusinessHours, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
};

const timeInputClass =
  'rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500';

interface BusinessHoursEditorProps {
  value: BusinessHours;
  onChange: (next: BusinessHours) => void;
}

export default function BusinessHoursEditor({ value, onChange }: BusinessHoursEditorProps) {
  return (
    <div className="space-y-2">
      {(Object.keys(DAY_LABELS) as (keyof BusinessHours)[]).map((day) => {
        const dayHours = value[day];
        return (
          <div key={day} className="flex items-center gap-3 text-sm">
            <label className="flex w-32 items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                checked={dayHours !== null}
                onChange={(e) =>
                  onChange({ ...value, [day]: e.target.checked ? { open: '08:00', close: '18:00' } : null })
                }
              />
              <span className="text-gray-700">{DAY_LABELS[day]}</span>
            </label>
            {dayHours ? (
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  className={timeInputClass}
                  value={dayHours.open}
                  onChange={(e) => onChange({ ...value, [day]: { ...dayHours, open: e.target.value } })}
                />
                <span className="text-gray-400">a</span>
                <input
                  type="time"
                  className={timeInputClass}
                  value={dayHours.close}
                  onChange={(e) => onChange({ ...value, [day]: { ...dayHours, close: e.target.value } })}
                />
              </div>
            ) : (
              <span className="text-xs text-gray-400">Cerrado</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
