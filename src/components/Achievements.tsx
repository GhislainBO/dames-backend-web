/**
 * Achievements - Affiche les succes et le systeme de parrainage
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/NotificationService';
import './Achievements.css';

const API_URL = 'https://dames-backend-production.up.railway.app';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  reward: number;
  requirement: number;
  achievedAt?: string;
  claimed: boolean;
}

interface ReferralStats {
  code: string;
  referralCount: number;
  totalEarned: number;
  rewards: {
    referrer: number;
    referee: number;
  };
}

interface AchievementsProps {
  isOpen: boolean;
  onClose: () => void;
  onBalanceChange?: () => void;
}

function Achievements({ isOpen, onClose, onBalanceChange }: AchievementsProps) {
  const { t } = useTranslation();
  const { token, isAuthenticated } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'achievements' | 'referral'>('achievements');
  const [referralCode, setReferralCode] = useState('');
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchData();
    }
  }, [isOpen, isAuthenticated]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Charger les succes
      const achResponse = await fetch(`${API_URL}/api/achievements/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const achData = await achResponse.json();
      if (achData.success) {
        setAchievements(achData.achievements);
        if (achData.newAchievements?.length > 0) {
          setNewAchievements(achData.newAchievements);
        }
      }

      // Charger les stats de parrainage
      const refResponse = await fetch(`${API_URL}/api/referral/code`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const refData = await refResponse.json();
      if (refData.success) {
        setReferralStats(refData);
      }
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const claimReward = async (achievementId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/achievements/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ achievementId }),
      });
      const data = await response.json();

      if (data.success) {
        setMessage(`+${data.reward} ${t('wallet.coins')}!`);
        onBalanceChange?.();
        fetchData();
      } else {
        setMessage(data.error || t('common.error'));
      }
    } catch (error) {
      setMessage(t('errors.connectionFailed'));
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const useReferralCode = async () => {
    if (!referralCode.trim()) {
      setMessage(t('achievements.enterCode'));
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/referral/use`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ code: referralCode.trim() }),
      });
      const data = await response.json();

      if (data.success) {
        setMessage(`${t('achievements.codeAccepted')} +${data.reward} ${t('wallet.coins')}`);
        setReferralCode('');
        onBalanceChange?.();
        fetchData();
      } else {
        setMessage(data.error || t('achievements.invalidCode'));
      }
    } catch (error) {
      setMessage(t('errors.connectionFailed'));
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const copyReferralCode = () => {
    if (referralStats?.code) {
      navigator.clipboard.writeText(referralStats.code);
      setMessage(t('achievements.codeCopied'));
      setTimeout(() => setMessage(''), 2000);
    }
  };

  const getShareText = () => {
    if (!referralStats) return '';
    return t('achievements.shareText', {
      code: referralStats.code,
      amount: referralStats.rewards.referee
    });
  };

  const getShareUrl = () => {
    return `https://dames-backend-web.vercel.app/?ref=${referralStats?.code || ''}`;
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(`${getShareText()}\n${getShareUrl()}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(t('achievements.shareTitle'));
    const body = encodeURIComponent(`${getShareText()}\n\n${getShareUrl()}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const shareViaFacebook = () => {
    const url = encodeURIComponent(getShareUrl());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const shareViaTwitter = () => {
    const text = encodeURIComponent(getShareText());
    const url = encodeURIComponent(getShareUrl());
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const shareViaTelegram = () => {
    const text = encodeURIComponent(`${getShareText()}\n${getShareUrl()}`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(getShareUrl())}&text=${text}`, '_blank');
  };

  const shareViaSMS = () => {
    const text = encodeURIComponent(`${getShareText()} ${getShareUrl()}`);
    window.open(`sms:?body=${text}`, '_blank');
  };

  const shareNative = () => {
    if (referralStats?.code && navigator.share) {
      navigator.share({
        title: t('achievements.shareTitle'),
        text: getShareText(),
        url: getShareUrl(),
      });
    } else {
      copyReferralCode();
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'games': return t('categories.games');
      case 'wins': return t('categories.wins');
      case 'social': return t('categories.social');
      case 'coins': return t('categories.coins');
      case 'tournament': return t('categories.tournament');
      case 'special': return t('categories.special');
      default: return category;
    }
  };

  const unlockedCount = achievements.filter(a => a.achievedAt).length;
  const unclaimedCount = achievements.filter(a => a.achievedAt && !a.claimed).length;

  if (!isOpen) return null;

  return (
    <div className="achievements-overlay" onClick={onClose}>
      <div className="achievements-modal" onClick={e => e.stopPropagation()}>
        <button className="achievements-close" onClick={onClose}>&times;</button>

        <h2>{t('menu.achievements')}</h2>

        {message && <div className="achievements-message">{message}</div>}

        {/* Onglets */}
        <div className="achievements-tabs">
          <button
            className={`tab-btn ${activeTab === 'achievements' ? 'active' : ''}`}
            onClick={() => setActiveTab('achievements')}
          >
            {t('achievements.title')} ({unlockedCount}/{achievements.length})
            {unclaimedCount > 0 && <span className="badge">{unclaimedCount}</span>}
          </button>
          <button
            className={`tab-btn ${activeTab === 'referral' ? 'active' : ''}`}
            onClick={() => setActiveTab('referral')}
          >
            {t('achievements.referral')}
          </button>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#888' }}>{t('common.loading')}</p>
        ) : activeTab === 'achievements' ? (
          <div className="achievements-list">
            {achievements.map(achievement => (
              <div
                key={achievement.id}
                className={`achievement-card ${achievement.achievedAt ? 'unlocked' : 'locked'} ${achievement.claimed ? 'claimed' : ''}`}
              >
                <div className="achievement-icon">{achievement.icon}</div>
                <div className="achievement-info">
                  <h4>{achievement.name}</h4>
                  <p>{achievement.description}</p>
                  <span className="achievement-category">{getCategoryLabel(achievement.category)}</span>
                </div>
                <div className="achievement-reward">
                  {achievement.achievedAt ? (
                    achievement.claimed ? (
                      <span className="claimed-badge">{t('achievements.claimed')}</span>
                    ) : (
                      <button
                        className="claim-btn"
                        onClick={() => claimReward(achievement.id)}
                      >
                        +{achievement.reward}
                      </button>
                    )
                  ) : (
                    <span className="reward-preview">{achievement.reward}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="referral-section">
            {/* Mon code de parrainage */}
            <div className="referral-card my-code">
              <h3>{t('achievements.myCode')}</h3>
              <div className="referral-code-display">
                <span className="code">{referralStats?.code || '...'}</span>
                <button className="copy-btn" onClick={copyReferralCode}>{t('achievements.copy')}</button>
              </div>

              {/* Boutons de partage réseaux sociaux */}
              <div className="social-share-section">
                <p className="share-label">{t('achievements.shareVia')}</p>
                <div className="social-buttons">
                  <button className="social-btn whatsapp" onClick={shareViaWhatsApp} title="WhatsApp">
                    <span className="social-icon">📱</span>
                    <span className="social-name">WhatsApp</span>
                  </button>
                  <button className="social-btn email" onClick={shareViaEmail} title="Email">
                    <span className="social-icon">📧</span>
                    <span className="social-name">Email</span>
                  </button>
                  <button className="social-btn facebook" onClick={shareViaFacebook} title="Facebook">
                    <span className="social-icon">📘</span>
                    <span className="social-name">Facebook</span>
                  </button>
                  <button className="social-btn twitter" onClick={shareViaTwitter} title="X / Twitter">
                    <span className="social-icon">🐦</span>
                    <span className="social-name">Twitter</span>
                  </button>
                  <button className="social-btn telegram" onClick={shareViaTelegram} title="Telegram">
                    <span className="social-icon">✈️</span>
                    <span className="social-name">Telegram</span>
                  </button>
                  <button className="social-btn sms" onClick={shareViaSMS} title="SMS">
                    <span className="social-icon">💬</span>
                    <span className="social-name">SMS</span>
                  </button>
                </div>
                {navigator.share && (
                  <button className="share-btn-native" onClick={shareNative}>
                    {t('achievements.moreOptions')}
                  </button>
                )}
              </div>

              <div className="referral-stats">
                <div className="stat">
                  <span className="stat-value">{referralStats?.referralCount || 0}</span>
                  <span className="stat-label">{t('achievements.referrals')}</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{referralStats?.totalEarned || 0}</span>
                  <span className="stat-label">{t('achievements.coinsEarned')}</span>
                </div>
              </div>
              <p className="referral-info">
                {t('achievements.referralInfo', { amount: referralStats?.rewards.referrer || 200 })}
              </p>
            </div>

            {/* Utiliser un code */}
            <div className="referral-card use-code">
              <h3>{t('achievements.useCode')}</h3>
              <p>{t('achievements.useCodeDesc', { amount: referralStats?.rewards.referee || 100 })}</p>
              <div className="code-input-group">
                <input
                  type="text"
                  value={referralCode}
                  onChange={e => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="CODE123"
                  maxLength={10}
                />
                <button onClick={useReferralCode}>{t('achievements.validate')}</button>
              </div>
            </div>
          </div>
        )}

        {/* Nouveaux succes debloques */}
        {newAchievements.length > 0 && (
          <div className="new-achievements-popup">
            <h3>{t('achievements.newUnlocked')}</h3>
            {newAchievements.map(ach => (
              <div key={ach.id} className="new-achievement">
                <span className="icon">{ach.icon}</span>
                <span className="name">{ach.name}</span>
              </div>
            ))}
            <button onClick={() => setNewAchievements([])}>{t('common.close')}</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Achievements;
