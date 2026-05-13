import { Disclosure, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import React, { useState } from 'react'

interface TopBarKasirProps {
  namaOutlet: string;
}

export default function TopBarKasir({ namaOutlet }: TopBarKasirProps) {

  // State untuk userName
  const [userName, setUserName] = useState(() => localStorage.getItem("user_name") || "")

  // Fungsi untuk handle sign out
  const handleSignOut = () => {
    localStorage.clear()
    setUserName("")
  }

  return (
    <Disclosure
        as="nav"
        className="bg-gray-900 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-white/10"
        style={{ position: 'fixed', top: 0, left: '0px', right: 0, zIndex: 1100 }}
    >
    <div className="w-full px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
            <div className="flex flex-1 items-center justify-center">
              <h3 className="text-4xl text-white dark:text-gray-200 font-bold ">Kasir Outlet {namaOutlet} </h3>
            </div>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">


            {/* Profile dropdown */}
            <Menu as="div" className="relative ml-3">
              <MenuButton className="relative flex rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">
                <span className="absolute -inset-1.5" />
                <span className="sr-only">Open user menu</span>
                <svg xmlns="http://www.w3.org/2000/svg"
                    width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2">
                  {/*-- Kotak utama --*/}
                  <rect x="3" y="7" width="18" height="13" rx="2" ry="2" fill="#f2f2f2" stroke="black"/>

                  {/*-- Tutup kotak --*/}
                  <path d="M3 7 L12 3 L21 7 Z" fill="#d9d9d9" stroke="black"/>

                  {/*-- Garis label --*/}
                  <line x1="7" y1="12" x2="17" y2="12" stroke="black"/>
                  <line x1="7" y1="16" x2="17" y2="16" stroke="black"/>
                </svg>

              </MenuButton>

              <MenuItems
                transition
                className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-gray-800 py-1 outline -outline-offset-1 outline-white/10 transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
              >

                <MenuItem>
                  <a
                    href="/myprofile"
                    onClick={handleSignOut}
                    className="block px-4 py-2 text-sm text-gray-300 data-focus:bg-white/5 data-focus:outline-hidden"
                  >
                    Tutup
                  </a>
                </MenuItem>
              </MenuItems>
            </Menu>
          </div>
        </div>
      </div>

    </Disclosure>
  )
}
