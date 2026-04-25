// Option 1 v2 — Classique pro avec header image (gradient bleu)

const Option1v2 = () => {
  const ink = '#0b1d3a';
  const brandBlue = '#1f7fc7';
  const brandDeep = '#1a3a6b';
  const softBg = '#f5f8fc';
  const rule = '#dce4ef';

  const Row = ({ emoji, title, desc, price }) => (
    <div style={{
      display: 'grid', gridTemplateColumns: '44px 1fr auto',
      gap: 16, alignItems: 'start', padding: '16px 0',
      borderBottom: `1px solid ${rule}`,
    }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: softBg, color: brandBlue, display: 'grid', placeItems: 'center', fontSize: 22 }}>{emoji}</div>
      <div>
        <div style={{ fontWeight: 600, color: ink, fontSize: 15, marginBottom: 4 }}>{title}</div>
        <div style={{ color: '#4a5878', fontSize: 14, lineHeight: 1.55 }}>{desc}</div>
      </div>
      <div style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12, color: brandDeep, whiteSpace: 'nowrap', background: '#eef3fa', padding: '6px 10px', borderRadius: 6, fontWeight: 600, marginTop: 2 }}>{price}</div>
    </div>
  );

  const Check = ({ children }) => (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', fontSize: 14, color: ink, lineHeight: 1.55 }}>
      <span style={{ width: 18, height: 18, borderRadius: 999, background: brandBlue, color: 'white', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>✓</span>
      <span>{children}</span>
    </div>
  );

  return (
    <div style={{ width: 720, background: 'white', fontFamily: '"Inter", system-ui, sans-serif', color: ink, fontSize: 14, lineHeight: 1.6 }}>
      {/* Header with image */}
      <div style={{
        position: 'relative', padding: '40px 48px 48px',
        backgroundImage: 'linear-gradient(180deg, rgba(14,36,72,0.35) 0%, rgba(14,36,72,0.65) 100%), url(https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=1600)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        color: 'white',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <img src="assets/waouh-logo.png" alt="Waouh Monde" style={{ height: 52, filter: 'brightness(0) invert(1)' }} />
          <div style={{ textAlign: 'right', fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', opacity: 0.9 }}>
            <div style={{ fontWeight: 600, letterSpacing: 1.4 }}>Entreprise de Services du Numérique</div>
            <div style={{ opacity: 0.75 }}>Abomey-Calavi · Bénin · Depuis 2019</div>
          </div>
        </div>
        <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.75, marginBottom: 8 }}>Objet</div>
        <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.3, maxWidth: 560 }}>
          [Nom Entreprise], Waouh Monde accompagne votre transformation digitale
        </div>
      </div>

      <div style={{ padding: '40px 48px' }}>
        <div style={{ fontSize: 15, marginBottom: 20 }}>Bonjour [Civilité] [Nom],</div>
        <p style={{ margin: '0 0 16px 0' }}>
          Nous sommes <strong style={{ color: brandDeep }}>Waouh Monde</strong>, votre Entreprise de Services du Numérique basée à Abomey-Calavi depuis 2019. Nous accompagnons les professionnels, entreprises et institutions béninoises dans leur transformation digitale.
        </p>
        <p style={{ margin: '0 0 28px 0' }}>
          Nous souhaitons aujourd'hui mettre notre expertise au service de <strong>[Nom Entreprise]</strong>.
        </p>

        <h3 style={{ fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: brandDeep, margin: '0 0 4px 0', fontWeight: 700 }}>Nos solutions pour votre entreprise</h3>
        <div style={{ marginBottom: 32 }}>
          <Row emoji="📧" title="Crédibilité professionnelle" desc="Email @votreentreprise.com + Google Maps + référencement" price="à partir de 35 000 FCFA" />
          <Row emoji="🎨" title="Identité visuelle cohérente" desc="Logo, charte graphique, supports print et digital" price="à partir de 80 000 FCFA" />
          <Row emoji="🌐" title="Présence web complète" desc="Sites vitrine, e-commerce, applications métier sur-mesure" price="sur devis" />
          <Row emoji="💼" title="Applications de gestion" desc="Solutions adaptées à vos processus internes" price="sur devis" />
        </div>

        <div style={{ background: softBg, borderLeft: `3px solid ${brandBlue}`, padding: '20px 24px', borderRadius: '0 8px 8px 0', marginBottom: 28 }}>
          <h3 style={{ fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: brandDeep, margin: '0 0 10px 0', fontWeight: 700 }}>Pourquoi travailler avec Waouh Monde ?</h3>
          <Check>Entreprise béninoise avec références institutionnelles vérifiables</Check>
          <Check>Équipe technique locale qui comprend vos réalités</Check>
          <Check>Solutions adaptées au contexte et aux budgets locaux</Check>
          <Check>Support en français et suivi personnalisé de proximité</Check>
        </div>

        <p style={{ margin: '0 0 10px 0' }}>
          Découvrez nos réalisations : <a href="#" style={{ color: brandBlue, textDecoration: 'none', borderBottom: `1px solid ${brandBlue}` }}>https://www.waouhmonde.com/leffet-waouh/</a>
        </p>
        <p style={{ margin: '0 0 28px 0' }}>
          Vous pouvez accéder à notre catalogue de solutions prêtes à l'emploi des applications métier déjà développées que vous pouvez adopter rapidement pour votre secteur d'activité.
        </p>

        <h3 style={{ fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: brandDeep, margin: '0 0 12px 0', fontWeight: 700 }}>Prochaine étape ?</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          {[
            ['Soumettez votre projet en ligne', 'https://votreprojet.waouhmonde.com/'],
            ['Appelez-nous directement : 01 69 50 71 71', 'pour passer commande'],
            ['Répondez à ce mail avec vos questions', 'nous vous rappelons'],
          ].map(([a, b], i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 16px', border: `1px solid ${rule}`, borderRadius: 8 }}>
              <span style={{ color: brandBlue, fontWeight: 700 }}>→</span>
              <span><strong style={{ color: ink }}>{a}</strong> : <span style={{ color: '#4a5878' }}>{b}</span></span>
            </div>
          ))}
        </div>

        <p style={{ margin: '0 0 24px 0' }}>
          Nous serions ravis d'accompagner <strong>[Nom Entreprise]</strong> dans sa transformation numérique.
        </p>
        <div style={{ marginBottom: 4 }}>Cordialement,</div>
      </div>

      <div style={{ background: brandDeep, color: 'white', padding: '28px 48px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 0.3 }}>Waouh Monde SARL</div>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>Entreprise de Services du Numérique</div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>Abomey-Calavi, Bénin</div>
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.8, textAlign: 'right' }}>
          <div>📞 01 69 50 71 71</div>
          <div>✉️ contact@waouhmonde.com</div>
          <div>🌐 www.waouhmonde.com</div>
        </div>
      </div>
    </div>
  );
};

window.Option1v2 = Option1v2;
