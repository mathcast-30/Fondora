import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const { signIn, signInWithGoogle } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        const { error } = await signIn(email, password)
        if (error) {
            setError(error.message)
        } else {
            navigate('/')
        }
    }

    return (
        <div className="min-h-screen bg-navy flex items-center justify-center px-4">
            <div className="bg-navy-light rounded-2xl p-8 w-full max-w-md shadow-xl">
                <h1 className="text-white text-2xl font-bold mb-6 text-center">
                    Connexion à Fondora
                </h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-2 rounded-lg bg-white text-navy"
                    />
                    <input
                        type="password"
                        placeholder="Mot de passe"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-4 py-2 rounded-lg bg-white text-navy"
                    />

                    {error && <p className="text-red-400 text-sm">{error}</p>}

                    <button
                        type="submit"
                        className="w-full bg-emerald hover:bg-emerald-light text-white font-semibold py-2 rounded-lg transition"
                    >
                        Se connecter
                    </button>
                </form>

                <div className="my-4 text-center text-gray-400">ou</div>

                <button
                    onClick={signInWithGoogle}
                    className="w-full bg-white text-navy font-semibold py-2 rounded-lg hover:bg-graylight transition"
                >
                    Continuer avec Google
                </button>

                <p className="text-gray-400 text-sm text-center mt-6">
                    Pas encore de compte ?{' '}
                    <Link to="/signup" className="text-emerald hover:underline">
                        Inscris-toi
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default Login