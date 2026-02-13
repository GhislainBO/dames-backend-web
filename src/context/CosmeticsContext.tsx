/**
 * CosmeticsContext - Gestion des cosmétiques équipés
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';

const API_URL = 'https://dames-backend-production.up.railway.app';

// Types de cosmétiques
interface BoardTheme {
  lightSquare: string;
  darkSquare: string;
  highlight: string;
  validMove: string;
}

interface PieceStyle {
  whiteColor: string;
  whiteBorder: string;
  blackColor: string;
  blackBorder: string;
  kingSymbol: string;
}

interface Avatar {
  emoji: string;
}

interface EquippedCosmetics {
  boardTheme: BoardTheme;
  pieceStyle: PieceStyle;
  avatar: Avatar;
}

// Valeurs par défaut
const DEFAULT_BOARD_THEME: BoardTheme = {
  lightSquare: '#f0d9b5',
  darkSquare: '#b58863',
  highlight: '#ffff00',
  validMove: '#00ff00',
};

const DEFAULT_PIECE_STYLE: PieceStyle = {
  whiteColor: '#ffffff',
  whiteBorder: '#cccccc',
  blackColor: '#333333',
  blackBorder: '#000000',
  kingSymbol: 'crown',
};

const DEFAULT_AVATAR: Avatar = {
  emoji: '👤',
};

interface CosmeticsContextType {
  equipped: EquippedCosmetics;
  refreshCosmetics: () => Promise<void>;
  loading: boolean;
}

const CosmeticsContext = createContext<CosmeticsContextType | null>(null);

export function CosmeticsProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const [equipped, setEquipped] = useState<EquippedCosmetics>({
    boardTheme: DEFAULT_BOARD_THEME,
    pieceStyle: DEFAULT_PIECE_STYLE,
    avatar: DEFAULT_AVATAR,
  });
  const [loading, setLoading] = useState(false);

  const refreshCosmetics = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setEquipped({
        boardTheme: DEFAULT_BOARD_THEME,
        pieceStyle: DEFAULT_PIECE_STYLE,
        avatar: DEFAULT_AVATAR,
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/shop/my-cosmetics`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success && data.equipped) {
        const newEquipped: EquippedCosmetics = {
          boardTheme: DEFAULT_BOARD_THEME,
          pieceStyle: DEFAULT_PIECE_STYLE,
          avatar: DEFAULT_AVATAR,
        };

        // Board theme
        if (data.equipped.board_theme?.data) {
          newEquipped.boardTheme = {
            lightSquare: data.equipped.board_theme.data.lightSquare || DEFAULT_BOARD_THEME.lightSquare,
            darkSquare: data.equipped.board_theme.data.darkSquare || DEFAULT_BOARD_THEME.darkSquare,
            highlight: data.equipped.board_theme.data.highlight || DEFAULT_BOARD_THEME.highlight,
            validMove: data.equipped.board_theme.data.validMove || DEFAULT_BOARD_THEME.validMove,
          };
        }

        // Piece style
        if (data.equipped.piece_style?.data) {
          newEquipped.pieceStyle = {
            whiteColor: data.equipped.piece_style.data.whiteColor || DEFAULT_PIECE_STYLE.whiteColor,
            whiteBorder: data.equipped.piece_style.data.whiteBorder || DEFAULT_PIECE_STYLE.whiteBorder,
            blackColor: data.equipped.piece_style.data.blackColor || DEFAULT_PIECE_STYLE.blackColor,
            blackBorder: data.equipped.piece_style.data.blackBorder || DEFAULT_PIECE_STYLE.blackBorder,
            kingSymbol: data.equipped.piece_style.data.kingSymbol || DEFAULT_PIECE_STYLE.kingSymbol,
          };
        }

        // Avatar
        if (data.equipped.avatar?.data) {
          newEquipped.avatar = {
            emoji: data.equipped.avatar.data.emoji || DEFAULT_AVATAR.emoji,
          };
        }

        setEquipped(newEquipped);
      }
    } catch (error) {
      console.error('Erreur chargement cosmétiques:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    refreshCosmetics();
  }, [refreshCosmetics]);

  return (
    <CosmeticsContext.Provider value={{ equipped, refreshCosmetics, loading }}>
      {children}
    </CosmeticsContext.Provider>
  );
}

export function useCosmetics() {
  const context = useContext(CosmeticsContext);
  if (!context) {
    throw new Error('useCosmetics must be used within a CosmeticsProvider');
  }
  return context;
}

// Helper pour convertir hex en nombre pour Phaser
export function hexToNumber(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}
