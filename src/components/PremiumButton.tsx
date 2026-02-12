/**
 * PremiumButton - Composants boutons haut de gamme pour DAMESELITE
 * Design System Elite Edition
 */

import React, { forwardRef } from 'react';
import './PremiumButton.css';

// Types de variantes disponibles
type ButtonVariant = 'play' | 'secondary' | 'tournament' | 'profile' | 'outline-gold' | 'ruby' | 'emerald';
type ButtonSize = 'sm' | 'md' | 'lg';

interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  children: React.ReactNode;
}

const PremiumButton = forwardRef<HTMLButtonElement, PremiumButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      fullWidth = false,
      icon,
      iconPosition = 'left',
      loading = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const classes = [
      'premium-btn',
      `premium-btn--${variant}`,
      `premium-btn--${size}`,
      fullWidth && 'premium-btn--full',
      loading && 'premium-btn--loading',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...props}
      >
        {/* Effet de brillance */}
        <span className="premium-btn__shine" aria-hidden="true" />

        {/* Contenu */}
        <span className="premium-btn__content">
          {icon && iconPosition === 'left' && (
            <span className="premium-btn__icon premium-btn__icon--left">{icon}</span>
          )}

          <span className="premium-btn__text">{children}</span>

          {icon && iconPosition === 'right' && (
            <span className="premium-btn__icon premium-btn__icon--right">{icon}</span>
          )}

          {loading && (
            <span className="premium-btn__loader" aria-label="Chargement">
              <span className="premium-btn__loader-dot" />
              <span className="premium-btn__loader-dot" />
              <span className="premium-btn__loader-dot" />
            </span>
          )}
        </span>

        {/* Bordure animee pour certaines variantes */}
        {(variant === 'play' || variant === 'tournament') && (
          <span className="premium-btn__border-glow" aria-hidden="true" />
        )}
      </button>
    );
  }
);

PremiumButton.displayName = 'PremiumButton';

export default PremiumButton;

// Export des sous-composants pour faciliter l'utilisation
export const PlayButton: React.FC<Omit<PremiumButtonProps, 'variant'>> = (props) => (
  <PremiumButton variant="play" size="lg" {...props} />
);

export const TournamentButton: React.FC<Omit<PremiumButtonProps, 'variant'>> = (props) => (
  <PremiumButton variant="tournament" {...props} />
);

export const ProfileButton: React.FC<Omit<PremiumButtonProps, 'variant'>> = (props) => (
  <PremiumButton variant="profile" {...props} />
);
