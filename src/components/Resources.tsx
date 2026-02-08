/**
 * Resources - Page de ressources recommandees (affiliation)
 *
 * Livres, cours, materiel pour les joueurs de dames
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './Resources.css';

interface Resource {
  id: string;
  title: string;
  description: string;
  category: 'book' | 'course' | 'equipment' | 'app';
  price: string;
  rating: number;
  url: string;
  image?: string;
  badge?: string;
}

interface ResourcesProps {
  isOpen: boolean;
  onClose: () => void;
}

// Ressources recommandees (liens affilies)
const RESOURCES: Resource[] = [
  // Livres
  {
    id: 'book1',
    title: 'Les Bases des Dames Internationales',
    description: 'Le guide complet pour debutants. Regles, strategies de base et exercices.',
    category: 'book',
    price: '19.90€',
    rating: 4.8,
    url: 'https://amazon.fr/dp/XXXXXXX?tag=dameselite-21',
    badge: 'Best-seller',
  },
  {
    id: 'book2',
    title: 'Tactiques Avancees aux Dames',
    description: 'Sacrifices, combinaisons et strategies pour joueurs intermediaires.',
    category: 'book',
    price: '24.90€',
    rating: 4.7,
    url: 'https://amazon.fr/dp/XXXXXXX?tag=dameselite-21',
  },
  {
    id: 'book3',
    title: 'Les Finales aux Dames',
    description: 'Maitriser les finales: dame vs dame, pions contre dame, etc.',
    category: 'book',
    price: '22.50€',
    rating: 4.9,
    url: 'https://amazon.fr/dp/XXXXXXX?tag=dameselite-21',
    badge: 'Recommande',
  },
  {
    id: 'book4',
    title: '100 Problemes de Dames',
    description: 'Collection de puzzles pour tous niveaux avec solutions detaillees.',
    category: 'book',
    price: '15.90€',
    rating: 4.6,
    url: 'https://amazon.fr/dp/XXXXXXX?tag=dameselite-21',
  },
  // Cours en ligne
  {
    id: 'course1',
    title: 'Dames: De Debutant a Expert',
    description: 'Cours video complet (8h) avec exercices interactifs et quiz.',
    category: 'course',
    price: '49.99€',
    rating: 4.9,
    url: 'https://udemy.com/course/dames-expert/?referralCode=DAMESELITE',
    badge: 'Top ventes',
  },
  {
    id: 'course2',
    title: 'Maitriser les Ouvertures',
    description: 'Les 10 meilleures ouvertures expliquees en detail.',
    category: 'course',
    price: '29.99€',
    rating: 4.7,
    url: 'https://udemy.com/course/dames-ouvertures/?referralCode=DAMESELITE',
  },
  {
    id: 'course3',
    title: 'Analyse de Parties de Maitres',
    description: 'Apprenez des meilleurs: 20 parties commentees coup par coup.',
    category: 'course',
    price: '34.99€',
    rating: 4.8,
    url: 'https://udemy.com/course/dames-maitres/?referralCode=DAMESELITE',
  },
  // Materiel
  {
    id: 'equip1',
    title: 'Plateau de Dames Professionnel',
    description: 'Plateau 10x10 en bois massif, cases 4cm, finition premium.',
    category: 'equipment',
    price: '89.00€',
    rating: 4.9,
    url: 'https://amazon.fr/dp/XXXXXXX?tag=dameselite-21',
    badge: 'Qualite pro',
  },
  {
    id: 'equip2',
    title: 'Set Pions Competition',
    description: '40 pions lestes en bois, noir et blanc, diametre 3.5cm.',
    category: 'equipment',
    price: '35.00€',
    rating: 4.7,
    url: 'https://amazon.fr/dp/XXXXXXX?tag=dameselite-21',
  },
  {
    id: 'equip3',
    title: 'Pendule d\'Echecs/Dames',
    description: 'Pendule digitale homologuee pour competitions officielles.',
    category: 'equipment',
    price: '45.00€',
    rating: 4.6,
    url: 'https://amazon.fr/dp/XXXXXXX?tag=dameselite-21',
  },
  // Apps
  {
    id: 'app1',
    title: 'Draughts Trainer Pro',
    description: 'App mobile avec 1000+ puzzles et analyse IA.',
    category: 'app',
    price: 'Gratuit',
    rating: 4.5,
    url: 'https://play.google.com/store/apps/details?id=com.draughts.trainer',
  },
];

const Resources: React.FC<ResourcesProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<string>('all');

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      book: '📚',
      course: '🎓',
      equipment: '🎯',
      app: '📱',
    };
    return icons[category] || '📦';
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      book: t('resources.books', 'Livres'),
      course: t('resources.courses', 'Cours'),
      equipment: t('resources.equipment', 'Materiel'),
      app: t('resources.apps', 'Applications'),
    };
    return labels[category] || category;
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    return (
      <span className="stars">
        {'★'.repeat(fullStars)}
        {hasHalf && '½'}
        <span className="rating-number">({rating})</span>
      </span>
    );
  };

  const filteredResources = filter === 'all'
    ? RESOURCES
    : RESOURCES.filter(r => r.category === filter);

  const openResource = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  return (
    <div className="resources-overlay" onClick={onClose}>
      <div className="resources-modal" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>&times;</button>

        <div className="resources-header">
          <h2>{t('resources.title', 'Ressources Recommandees')}</h2>
          <p>{t('resources.subtitle', 'Livres, cours et materiel pour progresser')}</p>
        </div>

        {/* Avertissement affiliation */}
        <div className="affiliate-notice">
          <span className="notice-icon">ℹ️</span>
          <p>{t('resources.affiliateNotice', 'Certains liens sont affilies. Vos achats nous aident a maintenir le jeu gratuit.')}</p>
        </div>

        {/* Filtres */}
        <div className="category-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            {t('resources.all', 'Tous')}
          </button>
          {['book', 'course', 'equipment', 'app'].map(cat => (
            <button
              key={cat}
              className={`filter-btn ${filter === cat ? 'active' : ''}`}
              onClick={() => setFilter(cat)}
            >
              {getCategoryIcon(cat)} {getCategoryLabel(cat)}
            </button>
          ))}
        </div>

        {/* Liste des ressources */}
        <div className="resources-list">
          {filteredResources.map(resource => (
            <div
              key={resource.id}
              className="resource-card"
              onClick={() => openResource(resource.url)}
            >
              <div className="resource-icon">
                {getCategoryIcon(resource.category)}
              </div>

              <div className="resource-content">
                <div className="resource-header-row">
                  <h4>{resource.title}</h4>
                  {resource.badge && (
                    <span className="resource-badge">{resource.badge}</span>
                  )}
                </div>
                <p>{resource.description}</p>
                <div className="resource-meta">
                  {renderStars(resource.rating)}
                  <span className="resource-category">
                    {getCategoryLabel(resource.category)}
                  </span>
                </div>
              </div>

              <div className="resource-price">
                <span className="price">{resource.price}</span>
                <span className="view-btn">{t('resources.view', 'Voir')} →</span>
              </div>
            </div>
          ))}
        </div>

        {/* Message de soutien */}
        <div className="resources-footer">
          <p>
            {t('resources.footerText', 'Merci de soutenir DAMESELITE en utilisant nos liens!')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Resources;
