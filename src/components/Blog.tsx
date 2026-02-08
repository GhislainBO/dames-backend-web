/**
 * Blog - Page d'actualites et conseils strategiques
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './Blog.css';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: 'strategy' | 'news' | 'tips' | 'community';
  date: string;
  author: string;
  readTime: number;
  image?: string;
}

interface BlogProps {
  isOpen: boolean;
  onClose: () => void;
}

// Articles statiques
const BLOG_POSTS: BlogPost[] = [
  {
    id: '1',
    title: 'Les 5 erreurs des debutants a eviter',
    excerpt: 'Decouvrez les pieges classiques et comment les eviter pour progresser rapidement.',
    content: `1. Ne pas controler le centre
Le centre du plateau offre plus de mobilite. Les pieces centrales peuvent se deplacer dans plus de directions.

2. Oublier la prise obligatoire
Aux dames internationales, la capture est TOUJOURS obligatoire. Planifiez vos coups en consequence.

3. Negliger la promotion
Une dame vaut plusieurs pions. Cherchez toujours a promouvoir vos pieces.

4. Jouer trop vite
Prenez le temps d'analyser. Une erreur peut couter la partie.

5. Ne pas anticiper les coups adverses
Regardez toujours ce que votre adversaire peut jouer avant de bouger.`,
    category: 'tips',
    date: '2024-01-15',
    author: 'DAMESELITE Team',
    readTime: 3,
  },
  {
    id: '2',
    title: 'Strategie: Le sacrifice gagnant',
    excerpt: 'Apprenez quand et comment sacrifier une piece pour en capturer plusieurs.',
    content: `Le sacrifice est une tactique avancee qui consiste a donner volontairement une piece pour obtenir un avantage.

Quand sacrifier ?
- Quand vous pouvez forcer une capture multiple
- Quand vous pouvez atteindre la promotion
- Quand vous pouvez bloquer l'adversaire

Exemple classique:
Placez un pion en position de capture. L'adversaire DOIT le prendre (prise obligatoire). Cela ouvre une ligne pour votre autre piece qui peut alors capturer 2-3 pions.

Entrinez-vous avec les puzzles quotidiens!`,
    category: 'strategy',
    date: '2024-01-12',
    author: 'GrandMaster_X',
    readTime: 4,
  },
  {
    id: '3',
    title: 'Mise a jour: Nouveaux puzzles quotidiens!',
    excerpt: 'Nous avons ajoute de nouveaux puzzles pour tous les niveaux.',
    content: `Bonne nouvelle pour tous les joueurs!

Nous venons d'ajouter une nouvelle collection de puzzles quotidiens:
- 10 nouveaux puzzles faciles
- 8 puzzles de niveau moyen
- 5 puzzles difficiles pour les experts

Comment y acceder ?
Cliquez sur "Puzzle du Jour" dans le menu principal. Chaque jour, un nouveau puzzle vous attend!

Systeme de streaks:
Resolvez les puzzles chaque jour pour maintenir votre serie. Des badges speciaux attendent les joueurs perseverants!`,
    category: 'news',
    date: '2024-01-10',
    author: 'DAMESELITE Team',
    readTime: 2,
  },
  {
    id: '4',
    title: 'Rejoignez notre communaute Discord!',
    excerpt: 'Echangez avec d\'autres joueurs, participez aux defis et progressez ensemble.',
    content: `Notre serveur Discord est maintenant ouvert!

Que trouverez-vous ?
- #general : Discussions libres
- #aide-debutants : Posez vos questions
- #defis : Participez aux challenges hebdomadaires
- #strategie : Partagez vos analyses
- #annonces : Restez informes des nouveautes

Avantages:
- Trouvez des adversaires de votre niveau
- Apprenez des meilleurs joueurs
- Participez aux tournois communautaires
- Gagnez des badges exclusifs

Lien: discord.gg/dameselite`,
    category: 'community',
    date: '2024-01-08',
    author: 'DAMESELITE Team',
    readTime: 2,
  },
  {
    id: '5',
    title: 'Technique: Maitriser les finales',
    excerpt: 'Les finales de parties sont cruciales. Apprenez a les gerer comme un pro.',
    content: `En finale, chaque coup compte. Voici les principes essentiels:

1. Dame vs Pion
Une dame gagne generalement contre un pion isole. Bloquez le pion et forcez la capture.

2. Dame vs Dame
La position est cle. Controlez les grandes diagonales et forcez l'adversaire dans un coin.

3. Plusieurs pions
Cherchez la promotion! Avancez vos pions en les protegeant mutuellement.

4. Opposition
Placez vos pieces pour limiter les options adverses. L'opposition diagonale est puissante.

Conseil: Analysez vos parties perdues. Les finales ratees sont souvent la cause des defaites.`,
    category: 'strategy',
    date: '2024-01-05',
    author: 'TacticalGenius',
    readTime: 5,
  },
];

const Blog: React.FC<BlogProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<string>('all');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      strategy: t('blog.category.strategy', 'Strategie'),
      news: t('blog.category.news', 'Actualites'),
      tips: t('blog.category.tips', 'Conseils'),
      community: t('blog.category.community', 'Communaute'),
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      strategy: '#9C27B0',
      news: '#2196F3',
      tips: '#4CAF50',
      community: '#FF9800',
    };
    return colors[category] || '#888';
  };

  const filteredPosts = filter === 'all'
    ? BLOG_POSTS
    : BLOG_POSTS.filter(p => p.category === filter);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="blog-overlay" onClick={onClose}>
      <div className="blog-modal" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>&times;</button>

        {selectedPost ? (
          // Vue article
          <div className="blog-article">
            <button className="back-btn" onClick={() => setSelectedPost(null)}>
              &larr; {t('blog.backToList', 'Retour aux articles')}
            </button>

            <div className="article-header">
              <span
                className="article-category"
                style={{ background: getCategoryColor(selectedPost.category) }}
              >
                {getCategoryLabel(selectedPost.category)}
              </span>
              <h2>{selectedPost.title}</h2>
              <div className="article-meta">
                <span>{selectedPost.author}</span>
                <span>•</span>
                <span>{formatDate(selectedPost.date)}</span>
                <span>•</span>
                <span>{selectedPost.readTime} min</span>
              </div>
            </div>

            <div className="article-content">
              {selectedPost.content.split('\n\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>
        ) : (
          // Liste des articles
          <>
            <div className="blog-header">
              <h2>{t('blog.title', 'Blog & Actualites')}</h2>
              <p>{t('blog.subtitle', 'Conseils, strategies et nouveautes')}</p>
            </div>

            <div className="category-filters">
              <button
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                {t('blog.all', 'Tous')}
              </button>
              {['strategy', 'tips', 'news', 'community'].map(cat => (
                <button
                  key={cat}
                  className={`filter-btn ${filter === cat ? 'active' : ''}`}
                  onClick={() => setFilter(cat)}
                  style={{ '--cat-color': getCategoryColor(cat) } as React.CSSProperties}
                >
                  {getCategoryLabel(cat)}
                </button>
              ))}
            </div>

            <div className="posts-list">
              {filteredPosts.map(post => (
                <div
                  key={post.id}
                  className="post-card"
                  onClick={() => setSelectedPost(post)}
                >
                  <div className="post-content">
                    <span
                      className="post-category"
                      style={{ background: getCategoryColor(post.category) }}
                    >
                      {getCategoryLabel(post.category)}
                    </span>
                    <h3>{post.title}</h3>
                    <p>{post.excerpt}</p>
                    <div className="post-meta">
                      <span>{formatDate(post.date)}</span>
                      <span>•</span>
                      <span>{post.readTime} min de lecture</span>
                    </div>
                  </div>
                  <div className="post-arrow">&rarr;</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Blog;
