import React, { useState } from 'react';

export default function NewsletterSignup({ onSuccess, onError }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulation d'appel API (à remplacer par un vrai endpoint si besoin)
    setTimeout(() => {
      setLoading(false);
      if (email && email.includes('@')) {
        setEmail('');
        onSuccess && onSuccess("Inscription à la newsletter réussie !");
      } else {
        onError && onError("Veuillez entrer une adresse email valide.");
      }
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginTop: 32, background: 'rgba(245,243,231,0.7)', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(138,154,91,0.08)', maxWidth: 400, marginLeft: 'auto', marginRight: 'auto'
    }}>
      <h3 style={{ color: '#8A9A5B', marginBottom: 8 }}>Recevez nos meilleures recettes !</h3>
      <input
        type="email"
        placeholder="Votre email..."
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        style={{
          padding: '10px 16px',
          borderRadius: 8,
          border: '1.5px solid #a3b18a',
          fontSize: 16,
          width: '100%'
        }}
      />
      <button
        type="submit"
        disabled={loading}
        style={{
          background: '#a3b18a',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          padding: '10px 24px',
          fontWeight: 600,
          fontSize: 16,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1
        }}
      >
        {loading ? 'Inscription...' : 'Je m’inscris'}
      </button>
    </form>
  );
}
