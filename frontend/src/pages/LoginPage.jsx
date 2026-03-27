import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import { Lock, User } from 'lucide-react';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Check for common typo observed in screenshot
        if (email.toLowerCase().includes('elrabajon')) {
            Swal.fire({
                icon: 'warning',
                title: '¿Quisiste decir elrebajon?',
                text: 'Parece que escribiste "elrabajon" con A. Intenta con "elrebajon" (con E).',
                confirmButtonColor: '#ff0000'
            });
            return;
        }

        try {
            await login(email, password);
            Swal.fire({
                icon: 'success',
                title: '¡Bienvenido!',
                text: 'Acceso concedido al panel de administrador',
                timer: 2000,
                showConfirmButton: false
            });
            navigate('/admin');
        } catch (err) {
            let errorMessage = 'Error de conexión con el servidor. Verifica que el backend esté en línea y que VITE_API_URL esté configurado correctly.';
            
            if (err.response) {
                if (err.response.status === 400) {
                    // Improved error message for invalid credentials
                    errorMessage = 'Credenciales inválidas. Por favor, verifica tu email y contraseña e inténtalo de nuevo.';
                    if (err.response.data.message === 'User not found') {
                        // Improved error message for user not found, referencing the GET /api/seed endpoint
                        errorMessage = 'El usuario no existe. Asegúrate de haber ejecutado el "seed" de la base de datos (visita /api/seed en el backend desde tu navegador).';
                    }
                } else {
                    errorMessage = err.response.data.message || errorMessage;
                }
            }
            
            Swal.fire({
                icon: 'error',
                title: 'Error de Acceso',
                text: errorMessage
            });
        }
    };

    return (
        <div className="min-h-screen bg-brand-red flex items-center justify-center px-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-brand-red uppercase italic tracking-tighter mb-2">
                        El Rebajón
                    </h1>
                    <p className="text-gray-500 font-bold uppercase text-sm italic">Panel de Control</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-black uppercase text-gray-500 mb-1 ml-1">Email</label>
                        <div className="flex items-center bg-gray-100 rounded-xl px-4 py-3 border-2 border-transparent focus-within:border-brand-yellow transition-colors">
                            <User size={20} className="text-gray-400 mr-3" />
                            <input 
                                type="email" 
                                className="bg-transparent w-full outline-none font-bold text-gray-700"
                                placeholder="admin@elrebajon.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black uppercase text-gray-500 mb-1 ml-1">Contraseña</label>
                        <div className="flex items-center bg-gray-100 rounded-xl px-4 py-3 border-2 border-transparent focus-within:border-brand-yellow transition-colors">
                            <Lock size={20} className="text-gray-400 mr-3" />
                            <input 
                                type="password" 
                                className="bg-transparent w-full outline-none font-bold text-gray-700"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className="w-full bg-brand-yellow text-brand-red text-xl font-black py-4 rounded-xl shadow-[0_5px_0_0_rgba(180,140,0,1)] hover:translate-y-1 hover:shadow-none transition-all uppercase"
                    >
                        Entrar
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <button 
                        onClick={() => navigate('/')} 
                        className="text-gray-400 font-bold uppercase text-xs hover:text-brand-red transition-colors"
                    >
                        Volver a la Tienda
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
