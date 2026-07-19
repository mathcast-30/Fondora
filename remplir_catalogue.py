import yfinance as yf
from supabase import create_client
import time


# ⚠️ Remplace par tes vraies valeurs
SUPABASE_URL = "https://ptcdwzozambankspjwes.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0Y2R3em96YW1iYW5rc3Bqd2VzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NjU1OCwiZXhwIjoyMDk4MjUyNTU4fQ.QhDuQOH5yej3neZe1YtSEAVbMMWST_RgvqzG9Nua8kE"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Liste des tickers à insérer
tickers = {
    # Actions US (S&P 500 et Nasdaq 100 dédupliqués)
    "ACTION_USD": [
        "AAPL","MSFT","NVDA","AMZN","GOOGL","GOOG","META","TSLA","BRK-B","AVGO",
        "JPM","LLY","V","UNH","XOM","MA","COST","HD","PG","WMT","JNJ","ABBV",
        "MRK","CVX","CRM","BAC","NFLX","AMD","KO","PEP","TMO","WFC","ORCL","ACN",
        "MCD","CSCO","ABT","GE","DHR","AXP","TXN","PM","IBM","QCOM","INTU","LIN",
        "AMGN","SPGI","RTX","CAT","NEE","HON","GS","ISRG","LOW","BKNG","BLK","SYK",
        "VRTX","UPS","TJX","REGN","MDT","C","GILD","MMC","PLD","ADI","SBUX","MS",
        "CB","ZTS","MO","CI","SO","DUK","BSX","AON","ITW","CME","EOG","PGR","ETN",
        "DE","SHW","HCA","APD","CL","NOC","ELV","MMM","GD","FDX","NSC","USB",
        "AIG","MCO","COF","F","GM","EMR","KLAC","LRCX","AMAT","MU","SNPS","CDNS",
        "PAYX","CTAS","ODFL","FAST","VRSK","IDXX","ANSS","DXCM","ILMN","BIIB",
        "ALGN","ROST","ORLY","MNST","PCAR","CPRT","EXC","AEP","CEG","BKR","CTSH",
        "FANG","KDP","GEHC","ON","CRWD","PANW","FTNT","ZS","DDOG","TEAM","ABNB",
        "MELI","PDD","MRVL","WBD","TTWO","ZM","ENPH","RIVN","LCID","SNAP","UBER",
        "LYFT","COIN","SHOP","SQ","PYPL","INTC","NXPI","MPWR","KEYS","EPAM","SEDG",
        "PODD","SGEN","BMRN","ALXN","NBIX","UTHR","JAZZ","HOLX","PKI","XRAY","DVA",
        "HUM","CNC","MOH","PARA","NWSA","FOX","FOXA","LNC","PRU","MET","AFL",
        "ALL","PFG","CINF","WRB","RE","HIG","AMP","IVZ","BEN","TROW","STT","BK",
        "NTRS","RF","CFG","HBAN","KEY","FHN","MTB","ZION","CMA","BOH","UMBF",
        "OZK","HTLF","BOKF","IBOC","FFIN","CULP","SFNC","FBMS","TCBI","LKFN","TMUS","ADBE","MDLZ","DLTR","GRAB","GFS","SIRI"
    ],
    # Actions françaises et européennes
    "ACTION_EUR": [
        "MC.PA", "TTE.PA", "SAN.PA", "AIR.PA", "BNP.PA", "SU.PA", "AI.PA",
        "OR.PA", "DG.PA", "RI.PA", "CAP.PA", "ACA.PA", "KER.PA", "SGO.PA",
        "VIE.PA", "STM.PA", "DSY.PA", "HO.PA", "ORA.PA", "GLE.PA",
        "CS.PA", "EL.PA", "RNO.PA", "ATO.PA", "SAF.PA", "ML.PA",
        "WKL.PA", "PUB.PA", "SW.PA", "ERF.PA", "LR.PA", "TEP.PA",
        "BON.PA", "ENGI.PA", "RMS.PA", "SKA-B.ST", "STLA.PA", "ALO.PA", "AC.PA", "ADP.PA", "AF.PA", "AGN.PA", "ALO.PA",
        "APAM.AS", "AUB.PA", "BN.PA", "BOL.PA", "CA.PA", "CBT.PA", "CHSR.PA", "CNP.PA", "CO.PA",
        "DBV.PA", "EDEN.PA", "ELIS.PA", "ERA.PA", "FDJ.PA", "FNAC.PA", "GET.PA", "GTT.PA",
        "HAV.PA", "INF.PA", "LAF.PA", "LFO.PA", "LNA.PA", "MMB.PA", "NEO.PA", "PARRO.PA", "PAYT.PA", "RCO.PA", "REXL.PA", "SAVE.PA", "COFA.PA", "CRTO.PA",
        "SESG.PA", "SAP.DE", "SIE.DE", "ALV.DE", "DTE.DE", "MBG.DE", "BMW.DE", "BAS.DE", "BAYN.DE", "DHL.DE", "MUV2.DE", "ADS.DE", "IFX.DE", "VOW3.DE", "RWE.DE", "EOAN.DE", "HEI.DE", "CON.DE", "HEN3.DE", "FME.DE", "FRE.DE",
        "CBK.DE", "DBK.DE", "BEI.DE", "HG1.DE", "P911.DE", "RHM.DE", "MTX.DE", "HNR1.DE", "SY1.DE", "SRT3.DE",
        "ZAL.DE", "ENR.DE", "EVK.DE", "LEG.DE", "KBX.DE", "B4B.DE", "PUM.DE", "WCH.DE", "BOSS.DE", "AIXA.DE",
        "ASML.AS", "ADYEN.AS", "INGA.AS", "PRX.AS", "UNA.AS", "AHOD.AS", "DSM.AS", "HEIA.AS", "REN.AS", "KPN.AS",
        "NN.AS", "ASMI.AS", "BESI.AS", "WKL.AS", "IMCD.AS", "EXOR.AS", "RAND.AS", "AALB.AS", "JDEP.AS", "SBMO.AS", "AZN.L", "GSK.L", "BP.L", "SHEL.L", "HSBA.L", "ULVR.L", "DGE.L", "BATS.L", "REL.L", "RIO.L",
        "AAL.L", "GLEN.L", "BARC.L", "LLOY.L", "NAT.L", "PRU.L", "VOD.L", "NG.L", "UU.L", "SVT.L",
        "CPG.L", "BAE.L", "RR.L", "IAG.L", "WMT.L", "TSCO.L", "SBRY.L", "JD.L", "ABF.L", "MKS.L",
        "HLN.L", "EXPN.L", "RTO.L", "BDEV.L", "TW.L", "LGEN.L", "AV.L", "STJ.L", "INF.L", "SSE.L",
        "NESN.SW", "ROG.SW", "NOVN.SW", "UBSG.SW", "ZURN.SW", "GIVN.SW", "LONN.SW", "SIKA.SW", "ALC.SW", "SLHN.SW",
        "SGSN.SW", "CFR.SW", "UHR.SW", "GEBN.SW", "LOGN.SW", "KNIN.SW", "BAER.SW", "BALN.SW", "SCMN.SW", "STRA.SW",
        "SAN.MC", "BBVA.MC", "IBE.MC", "ITX.MC", "TEF.MC", "AMS.MC", "REP.MC", "FER.MC", "CLNX.MC", "GRF.MC", "CABK.MC", "SAB.MC", "MAP.MC", "REE.MC", "ENG.MC", "ANA.MC", "ACS.MC", "FDR.MC", "MTS.MC", "IDR.MC", "ENEL.MI", "ISP.MI", "ENI.MI", "RACE.MI", "STLAM.MI", "UCG.MI", "PRY.MI", "G.MI", "TRN.MI", "SRG.MI", "PST.MI", "CNHI.MI", "MONC.MI", "FBK.MI", "NEXI.MI", "TEN.MI", "AMP.MI", "INW.MI", "A2A.MI", "LDO.MI", "NOVO-B.CO", "DSV.CO", "ORSTED.CO", "MAERSK-B.CO", "CARL-B.CO", "COLO-B.CO", "VWS.CO", "PNDORA.CO", "NZYM-B.CO", "JYSK.CO", "VOLV-B.ST", "INVE-B.ST", "ATCO-A.ST", "SEBA.ST", "SHB-A.ST", "SWED-A.ST", "ERIC-B.ST", "HM-B.ST", "SAND.ST", "ASSA-B.ST",
        "HEXA-B.ST", "EPI-B.ST", "TEL2-B.ST", "TELIA.ST", "SKF-B.ST", "ALFA.ST", "GETI-B.ST", "BOL.ST", "SCA-B.ST", "EVO.ST", "ABI.BR", "KBC.BR", "UCB.BR", "SOLB.BR", "UM1.BR", "ARGX.BR", "GBLB.BR", "ACKB.BR", "BEKB.BR", "SOF.BR", "NESTE.HE", "NOKIA.HE", "SAMPO.HE", "UPM.HE", "VALMT.HE", "KNEBV.HE", "FORTUM.HE", "WRT1V.HE", "METSO.HE", "TYRES.HE"
    ],
    # ETF populaires
    "ETF_EUR": [
        "CW8.PA","EWLD.PA","ESE.PA","PAEEM.PA","PANX.PA","WPEA.PA",
        "LCUK.PA","LYYA.PA","C6E.PA","LYPS.PA","AMEW.PA","PSRI.PA",
        "PAASI.PA","ASIE.PA","LCUJ.PA","JPNH.PA","GWT.PA","WMAT.PA",
        "ANX.PA","RS2K.PA","BLOK.PA","GFIN.PA","ENER.PA","H2O.PA",
        "AIEV.PA","ROBO.PA","HEAL.PA","CARE.PA","MFDD.PA","LYSX.PA",
        "EXXT.DE","DBXD.DE","XDWD.DE","EXS1.DE","EXSA.DE","EXH1.DE",
        "SPPW.DE","ZPRS.DE","ZPRV.DE","IS3N.DE","IQQH.DE","IQQW.DE",
        "QDVE.DE","QDVG.DE","QDVH.DE","QDVJ.DE","QDVK.DE","QDVM.DE",
        "VAGF.DE","VGWD.DE","VHYL.DE","VGEM.DE","VJPN.DE","VEUR.DE"
    ],
    "ETF_USD": [
        "SPY","QQQ","VTI","IWM","EFA","VEA","VWO","IEMG","AGG","BND",
        "GLD","SLV","VNQ","XLF","XLK","XLE","XLV","XLI","ARKK","SOXX",
        "SMH","ICLN","TAN","BOTZ","VIG","SCHD","JEPI","JEPQ","QYLD","RYLD",
        "XYLD","VGT","VOO","IVV","SPYG","MGK","VUG","VTV","IWF","IWD",
        "IJH","IJR","DIA","MDY","RSP","COWZ","QUAL","MTUM","USMV","ACWI",
        "IWDA.L","VWRL.L","EQQQ.L","VUSA.L","VUAG.L","VHYL.L","IUSA.L",
        "CSPX.L","SWRD.L","HMWO.L","IGLN.L","VGOV.L","CORP.L","IBTS.L",
        "VDPX.L","VMID.L","ISF.L","IUKD.L","MIDD.L","LTAM.L","ASIA.L",
        "VJPN.L","VERX.L","VFEM.L","VVAL.L","VMOM.L","VFMF.L","VWRA.L",
        "VAGP.L","VDCA.L","VGCP.L","VGLT.L","VGSH.L","VGIT.L","VGEB.L"
    ]
}

def inserer_actif(ticker, type_actif, devise):
    try:
        info = yf.Ticker(ticker).info
        nom = info.get("longName") or info.get("shortName") or ticker
        
        logo_url = None
        if info.get("website"):
            clean_domain = info["website"].replace("https://", "").replace("http://", "").replace("www.", "").split("/")[0]
            logo_url = f"https://logo.clearbit.com/{clean_domain}"
        
        data = {
            "ticker": ticker,
            "nom": nom,
            "type": type_actif,
            "devise": devise,
            "logo_url": logo_url
        }
        
        supabase.table("catalogue_actifs").upsert(data, on_conflict="ticker").execute()
        print(f"✅ {ticker} — {nom} ({devise})")
    except Exception as e:
        print(f"❌ {ticker} — Erreur : {e}")
    
    time.sleep(0.4)  # Anti-ban léger Yahoo

# ─────────────────────────────────────────
# EXECUTION DU REMPLISSAGE
# ─────────────────────────────────────────
print("🚀 Remplissage du catalogue en cours...\n")

# 1. Actions US (Utilisation de sets pour supprimer définitivement les doublons de ta liste)
print("─── ACTIONS US ───")
for ticker in set(tickers["ACTION_USD"]):
    inserer_actif(ticker, "ACTION", "USD")

# 2. Actions Europe (Avec détection dynamique de la devise)
print("\n─── ACTIONS EUROPE ───")
for ticker in set(tickers["ACTION_EUR"]):
    if ticker.endswith(".L"):
        devise = "GBP"
    elif ticker.endswith(".SW"):
        devise = "CHF"
    elif ticker.endswith(".CO"):
        devise = "DKK"
    elif ticker.endswith(".ST"):
        devise = "SEK"
    else:
        devise = "EUR"  # Par défaut (.PA, .DE, .AS, .MC, .MI, .BR, .HE)
        
    inserer_actif(ticker, "ACTION", "devise")

# 3. ETF EUR
print("\n─── ETF EUR ───")
for ticker in set(tickers["ETF_EUR"]):
    inserer_actif(ticker, "ETF", "EUR")

# 4. ETF USD
print("\n─── ETF USD ───")
for ticker in set(tickers["ETF_USD"]):
    devise = "GBP" if ticker.endswith(".L") else "USD"
    inserer_actif(ticker, "ETF", devise)

print("\n✅ Catalogue mis à jour avec succès !")