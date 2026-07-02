import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Signup() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const { signUp, signInWithGoogle } = useAuth()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        const { error } = await signUp(email, password)
        if (error) {
            setError(error.message)
        } else {
            setSuccess(true)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen bg-navy flex items-center justify-center px-4">
                <div className="bg-navy-light rounded-2xl p-8 w-full max-w-md text-center">
                    <h1 className="text-white text-2xl font-bold mb-4">Vérifie ta boîte mail 📧</h1>
                    <p className="text-gray-300">
                        Un email de confirmation t'a été envoyé. Clique sur le lien pour activer ton compte.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-navy flex items-center justify-center px-4">
            <div className="bg-navy-light rounded-2xl p-8 w-full max-w-md shadow-xl">
                <h1 className="text-white text-2xl font-bold mb-6 text-center">
                    Crée ton compte Fondora
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
                        placeholder="Mot de passe (6 caractères min.)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full px-4 py-2 rounded-lg bg-white text-navy"
                    />

                    {error && <p className="text-red-400 text-sm">{error}</p>}

                    <button
                        type="submit"
                        className="w-full bg-emerald hover:bg-emerald-light text-white font-semibold py-2 rounded-lg transition"
                    >
                        S'inscrire
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
                    Déjà un compte ?{' '}
                    <Link to="/login" className="text-emerald hover:underline">
                        Connecte-toi
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default Signup