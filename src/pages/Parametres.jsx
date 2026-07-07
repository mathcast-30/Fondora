import Layout from '../components/Layout'
import SwitchDevise from '../components/devises/SwitchDevise'
import AffichageTaux from '../components/devises/AffichageTaux'
import './Parametres.css'

function Parametres() {
    return (
        <Layout>
            <h1 className="parametres-titre">Paramètres</h1>
            <p className="parametres-sous-titre">Personnalise ton expérience Fondora.</p>

            <section className="parametres-section">
                <h2 className="parametres-section-titre">Devises &amp; Taux de change</h2>
                <div className="parametres-section-contenu">
                    <SwitchDevise />
                    <div style={{ marginTop: '24px' }}>
                        <AffichageTaux />
                    </div>
                </div>
            </section>
        </Layout>
    )
}

export default Parametres