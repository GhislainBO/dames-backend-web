/**
 * AudioControl - Composant de contrôle du son
 */

import React, { useState, useEffect } from 'react';
import { audioManager } from '../game/AudioManager';
import './AudioControl.css';

function AudioControl() {
  const [enabled, setEnabled] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [showSlider, setShowSlider] = useState(false);

  useEffect(() => {
    // Initialiser et charger les préférences
    audioManager.initialize().then(() => {
      setEnabled(audioManager.isEnabled());
      setVolume(audioManager.getVolume());
    });
  }, []);

  const handleToggle = () => {
    const newState = audioManager.toggle();
    setEnabled(newState);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    audioManager.setVolume(newVolume);
  };

  return (
    <div
      className="audio-control"
      onMouseEnter={() => setShowSlider(true)}
      onMouseLeave={() => setShowSlider(false)}
    >
      <button
        className={`audio-toggle ${enabled ? 'enabled' : 'disabled'}`}
        onClick={handleToggle}
        title={enabled ? 'Désactiver le son' : 'Activer le son'}
      >
        {enabled ? (
          volume > 0.5 ? '🔊' : volume > 0 ? '🔉' : '🔈'
        ) : '🔇'}
      </button>

      {showSlider && enabled && (
        <div className="volume-slider-container">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="volume-slider"
          />
        </div>
      )}
    </div>
  );
}

export default AudioControl;
