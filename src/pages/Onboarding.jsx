import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import StepProfilFiscal from '../components/onboarding/StepProfilFiscal'
import StepModules from '../components/onboarding/StepModules'
import StepPremierCompte from '../components/onboarding/StepPremierCompte'
import StepObjectif from '../components/onboarding/StepObjectif'
import StepResume from '../components/onboarding/StepResume'

const STEPS = [
    { titre: 'Votre situation fiscale' },
    { titre: 'Vos modules patrimoine' },
    { titre: 'Votre premier compte' },
    { titre: 'Votre objectif principal' },
    { titre: 'Récapitulatif' },
]

function Onboarding() {
    const { refreshProfile } = useAuth()
    const navigate = useNavigate()
    const [currentStep, setCurrentStep] = useState(0)
    const [wizardData, setWizardData] = useState({})

    const handleNext = (data) => {
        const newData = { ...wizardData, ...data }
        setWizardData(newData)
        setCurrentStep((s) => s + 1)
    }

    const handlePasser = () => {
        setCurrentStep(4)
    }

    const composants = [
        <StepProfilFiscal onNext={handleNext} />,
        <StepModules onNext={handleNext} />,
        <StepPremierCompte onNext={handleNext} />,
        <StepObjectif onNext={handleNext} />,
        <StepResume wizardData={wizardData} refreshProfile={refreshProfile} />,
    ]

    return (
        <div className="min-h-screen bg-navy flex items-center justify-center px-4">
            <div className="bg-navy-light rounded-2xl p-8 w-full max-w-lg shadow-xl">

                <div className="flex items-center justify-between mb-8">
                    <div className="flex gap-2">
                        {STEPS.map((_, i) => (
                            <div
                                key={i}
                                className={`h-2 w-8 rounded-full transition-all ${i <= currentStep ? 'bg-emerald' : 'bg-gray-700'
                                    }`}
                            />
                        ))}
                    </div>
                    <span className="text-gray-400 text-sm">
                        {currentStep + 1} / {STEPS.length}
                    </span>
                </div>

                <h2 className="text-white text-xl font-bold mb-6">
                    {STEPS[currentStep].titre}
                </h2>

                {composants[currentStep]}

                {currentStep < 4 && (
                    <button
                        onClick={handlePasser}
                        className="mt-4 text-gray-500 text-sm hover:text-gray-300 transition w-full text-right"
                    >
                        Passer →
                    </button>
                )}
            </div>
        </div>
    )
}

export default Onboarding