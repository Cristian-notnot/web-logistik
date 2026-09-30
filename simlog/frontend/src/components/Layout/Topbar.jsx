import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LogOut,
  ChevronDown,
  User
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';


const roleLabel = {
  admin_logistik: 'Admin Logistik',
  anggota_bidang: 'Anggota Bidang',
  ketua_pembina: 'Ketua / Pembina',
};


export default function Topbar({
  title,
  subtitle
}) {

  const {
    user,
    logout
  } = useAuth();


  const [open, setOpen] = useState(false);



  return (

    <header
      className="
        h-16
        shrink-0
        border-b
        border-slate-200
        bg-white
        px-6
      "
    >

      <div
        className="
          flex
          h-full
          items-center
          justify-between
        "
      >


        {/* TITLE */}

        <div>

          <h1
            className="
              text-lg
              font-bold
              leading-tight
              text-slate-900
            "
          >
            {title}
          </h1>


          {
            subtitle && (

              <p
                className="
                  text-xs
                  text-slate-500
                "
              >
                {subtitle}
              </p>

            )
          }


        </div>




        {/* USER MENU */}

        <div className="relative">


          <button

            onClick={() =>
              setOpen((o) => !o)
            }

            className="
              flex
              items-center
              gap-3
              rounded-lg
              px-2
              py-1.5
              pr-3
              transition
              hover:bg-slate-50
              focus-ring
            "

          >


            {
              user?.foto_url

              ?

              (

                <img
                  src={user.foto_url}
                  alt=""
                  className="
                    h-9
                    w-9
                    rounded-full
                    object-cover
                    border
                    border-slate-200
                  "
                />

              )

              :

              (

                <div
                  className="
                    flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-full
                    bg-blue-100
                    text-blue-600
                  "
                >

                  <User size={17}/>

                </div>

              )

            }



            <div
              className="
                hidden
                text-left
                sm:block
              "
            >

              <p
                className="
                  text-sm
                  font-semibold
                  leading-tight
                  text-slate-800
                "
              >
                {user?.nama}
              </p>


              <p
                className="
                  text-[11px]
                  leading-tight
                  text-slate-500
                "
              >

                {roleLabel[user?.role]}

                {
                  user?.nama_bidang &&
                  ` · ${user.nama_bidang}`
                }

              </p>


            </div>



            <ChevronDown
              size={15}
              className="
                text-slate-400
              "
            />


          </button>





          {
            open && (

              <div
                className="
                  absolute
                  right-0
                  z-20
                  mt-2
                  w-52
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  py-1.5
                  shadow-lg
                "
              >


                <Link

                  to="/profile"

                  onClick={() =>
                    setOpen(false)
                  }

                  className="
                    flex
                    items-center
                    gap-2
                    px-4
                    py-2
                    text-sm
                    text-slate-700
                    transition
                    hover:bg-blue-50
                    hover:text-blue-700
                  "

                >

                  <User size={15}/>

                  Profil saya

                </Link>




                <button

                  onClick={logout}

                  className="
                    flex
                    w-full
                    items-center
                    gap-2
                    px-4
                    py-2
                    text-sm
                    text-red-600
                    transition
                    hover:bg-red-50
                  "

                >

                  <LogOut size={15}/>

                  Keluar

                </button>


              </div>

            )
          }


        </div>


      </div>


    </header>

  );
}