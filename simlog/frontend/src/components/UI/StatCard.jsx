import React from 'react';

export default function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'brand',
  suffix
}) {

  const accentMap = {
    brand: 'bg-blue-100 text-blue-600',
    baik: 'bg-emerald-100 text-emerald-600',
    rusak: 'bg-red-100 text-red-600',
    maintenance: 'bg-orange-100 text-orange-600',
    hilang: 'bg-slate-100 text-slate-600',
  };


  return (

    <div
      className="
        flex
        items-start
        justify-between
        rounded-xl
        border
        border-slate-200
        bg-white
        p-5
        shadow-sm
        hover:shadow-md
        transition
      "
    >

      <div>

        <p
          className="
            text-xs
            font-semibold
            uppercase
            tracking-[0.12em]
            text-slate-500
          "
        >
          {label}
        </p>


        <p
          className="
            mt-2
            text-3xl
            font-bold
            text-slate-900
            tabular-nums
          "
        >

          {value}

          {
            suffix && (
              <span
                className="
                  ml-1
                  text-sm
                  font-medium
                  text-slate-400
                "
              >
                {suffix}
              </span>
            )
          }

        </p>

      </div>



      {
        Icon && (

          <div
            className={`
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-xl
              ${accentMap[accent] || accentMap.brand}
            `}
          >

            <Icon
              size={21}
              strokeWidth={2.25}
            />

          </div>

        )
      }


    </div>

  );
}