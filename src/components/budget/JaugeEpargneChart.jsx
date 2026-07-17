import { useEffect, useState } from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import SecureValue from '../SecureValue';

export default function JaugeEpargneChart({ epargneRealisee }) {
    const { user } = useAuth();
    const [objectif, setObjectif] = useState(500);

    useEffect(() => {
        async function fetchObjectif() {
            if (!user) return;
            const { data, error } = await supabase
                .from('profiles')
                .select('objectif_epargne_mensuel')
                .eq('id', user.id)
                .maybeSingle();
            
            if (data?.objectif_epargne_mensuel) {
                setObjectif(data.objectif_epargne_mensuel);
            } else if (!error && !data) {
                // If the user profile doesn't have it, we fallback to 500
                setObjectif(500);
            }
        }
        fetchObjectif();
    }, [user]);

    const epargne = (epargneRealisee !== undefined && epargneRealisee !== null) ? epargneRealisee : 1200;
    const currentObjectif = objectif || 500;

    const pourcentage = Math.max(0, Math.min(100, Math.round((epargne / currentObjectif) * 100)));
    
    let couleur = '#ef4444'; // Rouge < 50%
    if (pourcentage >= 100) couleur = '#10b981'; // Vert
    else if (pourcentage >= 50) couleur = '#f59e0b'; // Orange

    const data = [{
        name: 'Epargne',
        value: pourcentage,
        fill: couleur
    }];

    const formatMontant = (m) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(m);

    return (
        <div className="bg-card rounded-2xl border border-[var(--border)] p-6 flex flex-col justify-center items-center">
            <h3 className="text-[var(--text-h)] font-semibold mb-2 self-start w-full">Objectif d'épargne</h3>
            
            <div className="h-48 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart 
                        cx="50%" 
                        cy="60%" 
                        innerRadius="70%" 
                        outerRadius="100%" 
                        barSize={20} 
                        data={data} 
                        startAngle={180} 
                        endAngle={0}
                    >
                        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                        <RadialBar 
                            minAngle={15} 
                            background={{ fill: 'var(--bg-surface)' }} 
                            clockWise={true}
                            dataKey="value" 
                            cornerRadius={10} 
                        />
                    </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center mt-8">
                    <span className="text-3xl font-bold text-[var(--text-h)]">{pourcentage}%</span>
                </div>
            </div>
            
            <div className="text-center mt-2">
                <p className="text-[var(--text)] font-medium">
                    <span className={pourcentage >= 100 ? 'text-emerald font-bold' : 'text-[var(--text-h)]'}><SecureValue value={epargne} formatter={formatMontant} /></span> 
                    <span className="text-[var(--text-muted)] mx-1">/</span> 
                    <SecureValue value={currentObjectif} formatter={formatMontant} />
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">épargne réalisée ce mois</p>
            </div>
        </div>
    );
}
