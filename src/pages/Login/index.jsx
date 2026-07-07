import React from 'react'

import logo from '../../assets/images/logo-clinica.png'
import LoginForm from '../../components/LoginForm'
import { useTheme } from '../../contexts/ThemeContext'
import { MdDarkMode, MdLightMode } from 'react-icons/md'

const Login = () => {
    const { theme, toggleTheme } = useTheme()

    return (
        <>
            <div className='relative flex min-h-screen bg-gray-100'>
                <button
                    type='button'
                    onClick={toggleTheme}
                    className='absolute right-4 top-4 z-10 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100'
                >
                    {theme === 'dark' ? <MdLightMode size={18} /> : <MdDarkMode size={18} />}
                    {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
                </button>
                <div className='hidden md:flex w-1/2 bg-gray-200 flex-col items-center justify-center p-8'>
                    <img src={logo} alt='clinica' className='mb-6' />
                </div>
                <div className='flex w-full md:w-1/2 items-center justify-center p-8'>
                    <LoginForm />
                </div>
            </div>
        </>
    )
}

export default Login
