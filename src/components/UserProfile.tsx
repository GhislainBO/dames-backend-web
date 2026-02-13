/**
 * UserProfile - Affiche le profil utilisateur dans le header
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCosmetics } from '../context/CosmeticsContext';
import AuthModal from './AuthModal';
import './UserProfile.css';

function UserProfile() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { equipped } = useCosmetics();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Fermer le dropdown en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Toggle le dropdown au clic
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  if (isLoading) {
    return <div className="user-profile loading">...</div>;
  }

  if (!isAuthenticated || !user) {
    return (
      <>
        <div className="user-profile">
          <button
            className="login-button"
            onClick={() => setShowAuthModal(true)}
          >
            Connexion
          </button>
        </div>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </>
    );
  }

  const winRate = user.gamesPlayed > 0
    ? Math.round((user.gamesWon / user.gamesPlayed) * 100)
    : 0;

  return (
    <div
      ref={profileRef}
      className="user-profile authenticated"
      onClick={toggleDropdown}
    >
      <div className="user-avatar">{equipped.avatar.emoji}</div>
      <div className="user-info">
        <span className="user-name">{user.username}</span>
        <span className="user-elo">ELO: {user.elo}</span>
      </div>

      {showDropdown && (
        <div className="user-dropdown" onClick={(e) => e.stopPropagation()}>
          <div className="dropdown-stats">
            <div className="stat">
              <span className="stat-label">Parties jouées</span>
              <span className="stat-value">{user.gamesPlayed}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Victoires</span>
              <span className="stat-value wins">{user.gamesWon}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Défaites</span>
              <span className="stat-value losses">{user.gamesLost}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Nulles</span>
              <span className="stat-value draws">{user.gamesDraw}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Taux de victoire</span>
              <span className="stat-value">{winRate}%</span>
            </div>
          </div>

          <button className="logout-button" onClick={() => { logout(); setShowDropdown(false); }}>
            Déconnexion
          </button>
        </div>
      )}
    </div>
  );
}

export default UserProfile;
