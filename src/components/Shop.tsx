/**
 * Shop - Boutique de cosmétiques
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useCosmetics } from '../context/CosmeticsContext';
import './Shop.css';

const API_URL = 'https://dames-backend-production.up.railway.app';

interface Cosmetic {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  isPremiumOnly: boolean;
  isDefault: boolean;
  data: Record<string, any>;
}

interface ShopProps {
  isOpen: boolean;
  onClose: () => void;
  onBalanceChange?: () => void;
}

type Category = 'board_theme' | 'piece_style' | 'avatar';

function Shop({ isOpen, onClose, onBalanceChange }: ShopProps) {
  const { t } = useTranslation();
  const { token, isAuthenticated } = useAuth();
  const { refreshCosmetics } = useCosmetics();
  const [cosmetics, setCosmetics] = useState<Cosmetic[]>([]);
  const [owned, setOwned] = useState<string[]>([]);
  const [equipped, setEquipped] = useState<Record<string, string>>({});
  const [category, setCategory] = useState<Category>('board_theme');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [loadingCosmetics, setLoadingCosmetics] = useState(false);

  const CATEGORY_LABELS: Record<Category, string> = {
    board_theme: t('shop.boards'),
    piece_style: t('shop.pieces'),
    avatar: t('shop.avatars'),
  };

  useEffect(() => {
    if (isOpen) {
      // Charger les cosmétiques (public)
      fetchCosmetics();
      // Charger les cosmétiques de l'utilisateur seulement si authentifié
      if (isAuthenticated) {
        fetchUserCosmetics();
      }
    }
  }, [isOpen, isAuthenticated]);

  const fetchCosmetics = async () => {
    setLoadingCosmetics(true);
    try {
      const response = await fetch(`${API_URL}/api/shop/cosmetics`);
      const data = await response.json();
      console.log('Cosmetics loaded:', data);
      if (data.success) {
        setCosmetics(data.cosmetics);
      } else {
        setMessage(t('errors.unknownError'));
      }
    } catch (error) {
      console.error('Erreur chargement boutique:', error);
      setMessage(t('errors.connectionFailed'));
    } finally {
      setLoadingCosmetics(false);
    }
  };

  const fetchUserCosmetics = async () => {
    try {
      const response = await fetch(`${API_URL}/api/shop/my-cosmetics`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setOwned(data.userCosmetics.owned);
        const eq: Record<string, string> = {};
        for (const [cat, cosm] of Object.entries(data.equipped)) {
          if (cosm) eq[cat] = (cosm as Cosmetic).id;
        }
        setEquipped(eq);
      }
    } catch (error) {
      console.error('Erreur chargement cosmétiques:', error);
    }
  };

  const handlePurchase = async (cosmeticId: string) => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(`${API_URL}/api/shop/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ cosmeticId }),
      });
      const data = await response.json();
      if (data.success) {
        setMessage(t('shop.purchaseSuccess'));
        setOwned([...owned, cosmeticId]);
        onBalanceChange?.();
      } else {
        setMessage(data.error || t('shop.insufficientFunds'));
      }
    } catch (error) {
      setMessage(t('errors.connectionFailed'));
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleEquip = async (cosmeticId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/shop/equip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ cosmeticId }),
      });
      const data = await response.json();
      if (data.success) {
        const cosmetic = cosmetics.find(c => c.id === cosmeticId);
        if (cosmetic) {
          setEquipped({ ...equipped, [cosmetic.category]: cosmeticId });
        }
        setMessage(t('shop.equipped'));
        // Rafraîchir les cosmétiques pour la prochaine partie
        refreshCosmetics();
        setTimeout(() => setMessage(''), 2000);
      }
    } catch (error) {
      console.error('Erreur équipement:', error);
    }
  };

  if (!isOpen) return null;

  const filteredCosmetics = cosmetics.filter(c => c.category === category);

  return (
    <div className="shop-overlay" onClick={onClose}>
      <div className="shop-modal" onClick={e => e.stopPropagation()}>
        <button className="shop-close" onClick={onClose}>&times;</button>

        <h2>{t('shop.title')}</h2>

        {message && <div className="shop-message">{message}</div>}

        {!isAuthenticated && (
          <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(255, 165, 0, 0.2)', borderRadius: '8px', marginBottom: '15px', color: '#ffa500' }}>
            {t('shop.loginRequired')}
          </div>
        )}

        <div className="shop-categories">
          {(Object.keys(CATEGORY_LABELS) as Category[]).map(cat => (
            <button
              key={cat}
              className={`category-btn ${category === cat ? 'active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        <div className="cosmetics-grid">
          {loadingCosmetics && <p style={{ color: '#888', textAlign: 'center', gridColumn: '1 / -1' }}>{t('common.loading')}</p>}
          {!loadingCosmetics && filteredCosmetics.length === 0 && (
            <p style={{ color: '#888', textAlign: 'center', gridColumn: '1 / -1' }}>{t('shop.noItems')}</p>
          )}
          {filteredCosmetics.map(cosmetic => {
            const isOwned = owned.includes(cosmetic.id);
            const isEquipped = equipped[cosmetic.category] === cosmetic.id;

            return (
              <div key={cosmetic.id} className={`cosmetic-card ${isOwned ? 'owned' : ''} ${isEquipped ? 'equipped' : ''}`}>
                <div className="cosmetic-preview">
                  {cosmetic.category === 'avatar' ? (
                    <span className="avatar-emoji">{cosmetic.data.emoji}</span>
                  ) : cosmetic.category === 'board_theme' ? (
                    <div className="board-preview">
                      <div className="preview-square light" style={{ background: cosmetic.data.lightSquare }} />
                      <div className="preview-square dark" style={{ background: cosmetic.data.darkSquare }} />
                      <div className="preview-square dark" style={{ background: cosmetic.data.darkSquare }} />
                      <div className="preview-square light" style={{ background: cosmetic.data.lightSquare }} />
                    </div>
                  ) : (
                    <div className="piece-preview">
                      <div className="preview-piece white" style={{
                        background: cosmetic.data.whiteColor,
                        borderColor: cosmetic.data.whiteBorder
                      }} />
                      <div className="preview-piece black" style={{
                        background: cosmetic.data.blackColor,
                        borderColor: cosmetic.data.blackBorder
                      }} />
                    </div>
                  )}
                </div>

                <div className="cosmetic-info">
                  <h3>{cosmetic.name}</h3>
                  <p>{cosmetic.description}</p>
                  {cosmetic.isPremiumOnly && <span className="premium-tag">VIP</span>}
                </div>

                <div className="cosmetic-action">
                  {isEquipped ? (
                    <span className="equipped-badge">{t('shop.equipped')}</span>
                  ) : isOwned ? (
                    <button className="equip-btn" onClick={() => handleEquip(cosmetic.id)}>
                      {t('shop.equip')}
                    </button>
                  ) : (
                    <button
                      className="buy-btn"
                      onClick={() => handlePurchase(cosmetic.id)}
                      disabled={loading}
                    >
                      {cosmetic.price === 0 ? t('shop.free') : `🪙 ${cosmetic.price}`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Shop;
