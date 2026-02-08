/**
 * Tutorial - Mode tutoriel interactif ameliore
 * Avec illustrations SVG, quiz et certificat PDF
 */

import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import './Tutorial.css';

interface TutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

// Composants d'illustrations SVG pour chaque etape
const BoardIllustration = () => (
  <svg viewBox="0 0 200 200" className="tutorial-illustration">
    <defs>
      <pattern id="board-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
        <rect width="20" height="20" fill="#f0d9b5"/>
        <rect x="20" width="20" height="20" fill="#b58863"/>
        <rect y="20" width="20" height="20" fill="#b58863"/>
        <rect x="20" y="20" width="20" height="20" fill="#f0d9b5"/>
      </pattern>
    </defs>
    <rect x="20" y="20" width="160" height="160" fill="url(#board-pattern)" rx="8"/>
    <text x="100" y="110" textAnchor="middle" fill="#d4af37" fontSize="24" fontWeight="bold">10×10</text>
  </svg>
);

const PiecesIllustration = () => (
  <svg viewBox="0 0 200 200" className="tutorial-illustration">
    <circle cx="60" cy="100" r="30" fill="#faf0e6" stroke="#d4c4a8" strokeWidth="3"/>
    <circle cx="60" cy="100" r="20" fill="none" stroke="#e8d4b8" strokeWidth="1"/>
    <circle cx="140" cy="100" r="30" fill="#5b3210" stroke="#8b4513" strokeWidth="3"/>
    <circle cx="140" cy="100" r="20" fill="none" stroke="#3d2209" strokeWidth="1"/>
    <text x="60" y="160" textAnchor="middle" fill="#faf0e6" fontSize="12">Blancs</text>
    <text x="140" y="160" textAnchor="middle" fill="#8b4513" fontSize="12">Noirs</text>
  </svg>
);

const MovementIllustration = () => (
  <svg viewBox="0 0 200 200" className="tutorial-illustration">
    <rect x="30" y="80" width="40" height="40" fill="#b58863"/>
    <rect x="80" y="40" width="40" height="40" fill="#f0d9b5"/>
    <rect x="80" y="120" width="40" height="40" fill="#f0d9b5"/>
    <circle cx="50" cy="100" r="15" fill="#5b3210" stroke="#8b4513" strokeWidth="2"/>
    <path d="M65 85 L95 55" stroke="#2ecc71" strokeWidth="3" markerEnd="url(#arrow)"/>
    <path d="M65 115 L95 145" stroke="#2ecc71" strokeWidth="3" markerEnd="url(#arrow)"/>
    <defs>
      <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
        <path d="M0,0 L0,6 L9,3 z" fill="#2ecc71"/>
      </marker>
    </defs>
    <circle cx="100" cy="60" r="8" fill="#2ecc71" opacity="0.5"/>
    <circle cx="100" cy="140" r="8" fill="#2ecc71" opacity="0.5"/>
  </svg>
);

const CaptureIllustration = () => (
  <svg viewBox="0 0 200 200" className="tutorial-illustration">
    <rect x="20" y="80" width="40" height="40" fill="#b58863"/>
    <rect x="70" y="80" width="40" height="40" fill="#f0d9b5"/>
    <rect x="120" y="80" width="40" height="40" fill="#b58863"/>
    <circle cx="40" cy="100" r="15" fill="#5b3210" stroke="#8b4513" strokeWidth="2"/>
    <circle cx="90" cy="100" r="15" fill="#faf0e6" stroke="#d4c4a8" strokeWidth="2" opacity="0.5"/>
    <line x1="90" y1="85" x2="90" y2="115" stroke="#e74c3c" strokeWidth="3"/>
    <line x1="75" y1="100" x2="105" y2="100" stroke="#e74c3c" strokeWidth="3"/>
    <path d="M55 85 L125 85" stroke="#e74c3c" strokeWidth="3" strokeDasharray="5,5"/>
    <circle cx="140" cy="100" r="8" fill="#e74c3c" opacity="0.5"/>
  </svg>
);

const MultiCaptureIllustration = () => (
  <svg viewBox="0 0 200 200" className="tutorial-illustration">
    <rect x="10" y="90" width="35" height="35" fill="#b58863"/>
    <rect x="55" y="50" width="35" height="35" fill="#f0d9b5"/>
    <rect x="100" y="90" width="35" height="35" fill="#b58863"/>
    <rect x="145" y="50" width="35" height="35" fill="#f0d9b5"/>
    <circle cx="27" cy="107" r="12" fill="#5b3210"/>
    <circle cx="72" cy="67" r="12" fill="#faf0e6" opacity="0.4"/>
    <circle cx="117" cy="107" r="12" fill="#faf0e6" opacity="0.4"/>
    <path d="M40 95 L60 75 M85 75 L105 95 M130 95 L155 70" stroke="#e74c3c" strokeWidth="2"/>
    <text x="100" y="160" textAnchor="middle" fill="#e74c3c" fontSize="14" fontWeight="bold">x2</text>
  </svg>
);

const MajorityCaptureIllustration = () => (
  <svg viewBox="0 0 200 200" className="tutorial-illustration">
    <g transform="translate(20, 30)">
      <text x="40" y="15" fill="#888" fontSize="10">Option A: 1 prise</text>
      <circle cx="20" cy="40" r="10" fill="#5b3210"/>
      <circle cx="50" cy="40" r="10" fill="#faf0e6" opacity="0.5"/>
      <path d="M30 40 L70 40" stroke="#888" strokeWidth="2" strokeDasharray="3,3"/>
    </g>
    <g transform="translate(20, 100)">
      <text x="60" y="15" fill="#2ecc71" fontSize="10" fontWeight="bold">Option B: 2 prises (Obligatoire)</text>
      <circle cx="20" cy="40" r="10" fill="#5b3210"/>
      <circle cx="50" cy="40" r="10" fill="#faf0e6" opacity="0.5"/>
      <circle cx="100" cy="40" r="10" fill="#faf0e6" opacity="0.5"/>
      <path d="M30 40 L140 40" stroke="#2ecc71" strokeWidth="2"/>
      <text x="150" y="45" fill="#2ecc71" fontSize="16" fontWeight="bold">!</text>
    </g>
  </svg>
);

const KingIllustration = () => (
  <svg viewBox="0 0 200 200" className="tutorial-illustration">
    <rect x="70" y="130" width="60" height="40" fill="#b58863"/>
    <circle cx="100" cy="100" r="35" fill="#5b3210" stroke="#8b4513" strokeWidth="3"/>
    <circle cx="100" cy="100" r="15" fill="#ffd700"/>
    <circle cx="100" cy="100" r="8" fill="#dc143c"/>
    {[0, 72, 144, 216, 288].map((angle, i) => (
      <circle
        key={i}
        cx={100 + Math.cos(angle * Math.PI / 180) * 22}
        cy={100 + Math.sin(angle * Math.PI / 180) * 22}
        r="4"
        fill="#ffd700"
      />
    ))}
    <text x="100" y="180" textAnchor="middle" fill="#ffd700" fontSize="14" fontWeight="bold">DAME</text>
  </svg>
);

const KingMovementIllustration = () => (
  <svg viewBox="0 0 200 200" className="tutorial-illustration">
    <circle cx="100" cy="100" r="20" fill="#5b3210"/>
    <circle cx="100" cy="100" r="10" fill="#ffd700"/>
    {[45, 135, 225, 315].map((angle, i) => (
      <g key={i}>
        <line
          x1={100 + Math.cos(angle * Math.PI / 180) * 25}
          y1={100 + Math.sin(angle * Math.PI / 180) * 25}
          x2={100 + Math.cos(angle * Math.PI / 180) * 80}
          y2={100 + Math.sin(angle * Math.PI / 180) * 80}
          stroke="#2ecc71"
          strokeWidth="3"
          strokeDasharray="5,3"
        />
        <circle
          cx={100 + Math.cos(angle * Math.PI / 180) * 80}
          cy={100 + Math.sin(angle * Math.PI / 180) * 80}
          r="6"
          fill="#2ecc71"
          opacity="0.6"
        />
      </g>
    ))}
  </svg>
);

const VictoryIllustration = () => (
  <svg viewBox="0 0 200 200" className="tutorial-illustration">
    <circle cx="100" cy="80" r="50" fill="none" stroke="#ffd700" strokeWidth="3"/>
    <text x="100" y="90" textAnchor="middle" fill="#ffd700" fontSize="40">🏆</text>
    <text x="100" y="160" textAnchor="middle" fill="#2ecc71" fontSize="14" fontWeight="bold">VICTOIRE!</text>
    <g transform="translate(30, 170)">
      <rect width="140" height="8" rx="4" fill="#333"/>
      <rect width="0" height="8" rx="4" fill="#ffd700">
        <animate attributeName="width" from="0" to="140" dur="2s" repeatCount="indefinite"/>
      </rect>
    </g>
  </svg>
);

const StrategyIllustration = () => (
  <svg viewBox="0 0 200 200" className="tutorial-illustration">
    <circle cx="100" cy="60" r="30" fill="none" stroke="#4a9eff" strokeWidth="2" strokeDasharray="5,3"/>
    <text x="100" y="65" textAnchor="middle" fill="#4a9eff" fontSize="24">💡</text>
    <text x="100" y="120" textAnchor="middle" fill="#888" fontSize="11">Centre = Controle</text>
    <text x="100" y="140" textAnchor="middle" fill="#888" fontSize="11">Bords = Protection</text>
    <text x="100" y="160" textAnchor="middle" fill="#888" fontSize="11">Dames = Puissance</text>
  </svg>
);

const DrawIllustration = () => (
  <svg viewBox="0 0 200 200" className="tutorial-illustration">
    <circle cx="70" cy="100" r="25" fill="#5b3210"/>
    <circle cx="70" cy="100" r="12" fill="#ffd700"/>
    <circle cx="130" cy="100" r="25" fill="#faf0e6" stroke="#d4c4a8" strokeWidth="2"/>
    <circle cx="130" cy="100" r="12" fill="#ffd700"/>
    <text x="100" y="60" textAnchor="middle" fill="#888" fontSize="14">=</text>
    <text x="100" y="160" textAnchor="middle" fill="#f39c12" fontSize="12">Egalite</text>
    <text x="100" y="180" textAnchor="middle" fill="#666" fontSize="10">25 coups sans prise</text>
  </svg>
);

const InterfaceIllustration = () => (
  <svg viewBox="0 0 200 200" className="tutorial-illustration">
    <rect x="20" y="30" width="100" height="100" fill="#1a1a2e" stroke="#8b4513" strokeWidth="2" rx="4"/>
    <rect x="130" y="30" width="50" height="20" fill="#2ecc71" rx="4"/>
    <rect x="130" y="60" width="50" height="20" fill="#e74c3c" rx="4"/>
    <rect x="130" y="90" width="50" height="40" fill="#333" rx="4"/>
    <text x="155" y="44" textAnchor="middle" fill="#fff" fontSize="8">Jouer</text>
    <text x="155" y="74" textAnchor="middle" fill="#fff" fontSize="8">Menu</text>
    <text x="155" y="115" textAnchor="middle" fill="#888" fontSize="7">Historique</text>
    <circle cx="45" cy="55" r="8" fill="#faf0e6"/>
    <circle cx="95" cy="105" r="8" fill="#5b3210"/>
  </svg>
);

// Types pour le quiz
interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

// Composant Quiz
function TutorialQuiz({
  onComplete,
  score,
  setScore
}: {
  onComplete: () => void;
  score: number;
  setScore: (s: number) => void;
}) {
  const { t } = useTranslation();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);

  const questions: QuizQuestion[] = [
    {
      question: t('tutorial.quiz.q1', 'Combien de cases compte le plateau de dames internationales ?'),
      options: ['64 cases', '100 cases', '81 cases', '121 cases'],
      correct: 1,
      explanation: t('tutorial.quiz.e1', 'Le plateau fait 10x10 = 100 cases.')
    },
    {
      question: t('tutorial.quiz.q2', 'Dans quelle direction un pion peut-il avancer ?'),
      options: [
        t('tutorial.quiz.q2a', 'En arriere uniquement'),
        t('tutorial.quiz.q2b', 'En diagonale vers l\'avant'),
        t('tutorial.quiz.q2c', 'Horizontalement'),
        t('tutorial.quiz.q2d', 'Dans toutes les directions')
      ],
      correct: 1,
      explanation: t('tutorial.quiz.e2', 'Un pion avance uniquement en diagonale vers l\'avant.')
    },
    {
      question: t('tutorial.quiz.q3', 'Que se passe-t-il quand un pion atteint la derniere rangee ?'),
      options: [
        t('tutorial.quiz.q3a', 'Il est elimine'),
        t('tutorial.quiz.q3b', 'Il devient une dame'),
        t('tutorial.quiz.q3c', 'Rien de special'),
        t('tutorial.quiz.q3d', 'Il gagne la partie')
      ],
      correct: 1,
      explanation: t('tutorial.quiz.e3', 'Le pion est promu en dame et gagne en mobilite.')
    },
    {
      question: t('tutorial.quiz.q4', 'La prise est-elle obligatoire aux dames internationales ?'),
      options: [
        t('tutorial.quiz.q4a', 'Non, c\'est optionnel'),
        t('tutorial.quiz.q4b', 'Oui, toujours obligatoire'),
        t('tutorial.quiz.q4c', 'Seulement pour les dames'),
        t('tutorial.quiz.q4d', 'Seulement au premier coup')
      ],
      correct: 1,
      explanation: t('tutorial.quiz.e4', 'La prise est toujours obligatoire. S\'il y a plusieurs options, on doit prendre le maximum de pieces.')
    },
    {
      question: t('tutorial.quiz.q5', 'Comment gagne-t-on une partie de dames ?'),
      options: [
        t('tutorial.quiz.q5a', 'En ayant plus de pieces'),
        t('tutorial.quiz.q5b', 'En capturant toutes les pieces adverses ou bloquant l\'adversaire'),
        t('tutorial.quiz.q5c', 'En atteignant l\'autre cote'),
        t('tutorial.quiz.q5d', 'Au bout de 50 coups')
      ],
      correct: 1,
      explanation: t('tutorial.quiz.e5', 'On gagne en capturant toutes les pieces adverses ou en bloquant l\'adversaire.')
    }
  ];

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(index);
    setShowExplanation(true);

    const isCorrect = index === questions[currentQuestion].correct;
    setAnswers([...answers, isCorrect]);
    if (isCorrect) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      onComplete();
    }
  };

  const question = questions[currentQuestion];
  const isLastQuestion = currentQuestion === questions.length - 1;

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <span className="quiz-badge">QUIZ</span>
        <span className="quiz-progress">
          {currentQuestion + 1} / {questions.length}
        </span>
      </div>

      <h3 className="quiz-question">{question.question}</h3>

      <div className="quiz-options">
        {question.options.map((option, index) => (
          <button
            key={index}
            className={`quiz-option ${
              selectedAnswer !== null
                ? index === question.correct
                  ? 'correct'
                  : index === selectedAnswer
                  ? 'incorrect'
                  : ''
                : ''
            }`}
            onClick={() => handleAnswer(index)}
            disabled={selectedAnswer !== null}
          >
            <span className="option-letter">{String.fromCharCode(65 + index)}</span>
            <span className="option-text">{option}</span>
          </button>
        ))}
      </div>

      {showExplanation && (
        <div className={`quiz-explanation ${selectedAnswer === question.correct ? 'correct' : 'incorrect'}`}>
          <span className="explanation-icon">
            {selectedAnswer === question.correct ? '✓' : '✗'}
          </span>
          <p>{question.explanation}</p>
        </div>
      )}

      {showExplanation && (
        <button className="quiz-next-btn" onClick={handleNext}>
          {isLastQuestion ? t('tutorial.seeResults', 'Voir les resultats') : t('tutorial.nextQuestion', 'Question suivante')}
        </button>
      )}
    </div>
  );
}

// Composant Certificat
function Certificate({
  score,
  total,
  onDownload,
  onClose
}: {
  score: number;
  total: number;
  onDownload: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const percentage = Math.round((score / total) * 100);
  const passed = percentage >= 60;
  const date = new Date().toLocaleDateString();

  return (
    <div className="certificate-container">
      <div className={`certificate ${passed ? 'passed' : 'failed'}`}>
        <div className="certificate-border">
          <div className="certificate-header">
            <span className="certificate-icon">{passed ? '🏆' : '📚'}</span>
            <h2>{passed ? t('tutorial.certificateTitle', 'Certificat de Reussite') : t('tutorial.tryAgain', 'Continuez a apprendre!')}</h2>
          </div>

          <div className="certificate-body">
            <p className="certificate-text">
              {passed
                ? t('tutorial.certificateText', 'A complete avec succes le tutoriel des Dames Internationales')
                : t('tutorial.failText', 'Relisez le tutoriel et reessayez le quiz')}
            </p>

            <div className="certificate-score">
              <span className="score-value">{score}/{total}</span>
              <span className="score-label">{t('tutorial.correctAnswers', 'Bonnes reponses')}</span>
              <div className="score-bar">
                <div className="score-fill" style={{ width: `${percentage}%` }} />
              </div>
              <span className="score-percent">{percentage}%</span>
            </div>

            {passed && (
              <div className="certificate-footer">
                <p className="certificate-date">{date}</p>
                <p className="certificate-game">DAMESELITE</p>
              </div>
            )}
          </div>

          <div className="certificate-actions">
            {passed && (
              <button className="certificate-download" onClick={onDownload}>
                📥 {t('tutorial.downloadPDF', 'Telecharger PDF')}
              </button>
            )}
            <button className="certificate-close" onClick={onClose}>
              {passed ? t('tutorial.finish', 'Terminer') : t('tutorial.retryQuiz', 'Reessayer le quiz')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Tutorial({ isOpen, onClose }: TutorialProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [mode, setMode] = useState<'tutorial' | 'quiz' | 'certificate'>('tutorial');
  const [quizScore, setQuizScore] = useState(0);

  const tutorialSteps = [
    { titleKey: 'tutorial.step1Title', contentKey: 'tutorial.step1Content', illustration: BoardIllustration },
    { titleKey: 'tutorial.step2Title', contentKey: 'tutorial.step2Content', illustration: PiecesIllustration },
    { titleKey: 'tutorial.step3Title', contentKey: 'tutorial.step3Content', illustration: MovementIllustration },
    { titleKey: 'tutorial.step4Title', contentKey: 'tutorial.step4Content', illustration: CaptureIllustration },
    { titleKey: 'tutorial.step5Title', contentKey: 'tutorial.step5Content', illustration: MultiCaptureIllustration },
    { titleKey: 'tutorial.step6Title', contentKey: 'tutorial.step6Content', illustration: MajorityCaptureIllustration },
    { titleKey: 'tutorial.step7Title', contentKey: 'tutorial.step7Content', illustration: KingIllustration },
    { titleKey: 'tutorial.step8Title', contentKey: 'tutorial.step8Content', illustration: KingMovementIllustration },
    { titleKey: 'tutorial.step9Title', contentKey: 'tutorial.step9Content', illustration: VictoryIllustration },
    { titleKey: 'tutorial.step10Title', contentKey: 'tutorial.step10Content', illustration: DrawIllustration },
    { titleKey: 'tutorial.step11Title', contentKey: 'tutorial.step11Content', illustration: StrategyIllustration },
    { titleKey: 'tutorial.step12Title', contentKey: 'tutorial.step12Content', illustration: InterfaceIllustration },
  ];

  const generatePDF = useCallback(() => {
    const date = new Date().toLocaleDateString();
    const percentage = Math.round((quizScore / 5) * 100);

    // Creer un canvas pour le certificat
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Fond
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, 800, 600);

      // Bordure doree
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, 760, 560);
      ctx.strokeRect(30, 30, 740, 540);

      // Titre
      ctx.fillStyle = '#d4af37';
      ctx.font = 'bold 36px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText('CERTIFICAT DE REUSSITE', 400, 100);

      // Sous-titre
      ctx.fillStyle = '#888';
      ctx.font = '18px Arial';
      ctx.fillText('Tutoriel des Dames Internationales', 400, 140);

      // Trophee
      ctx.font = '80px Arial';
      ctx.fillText('🏆', 400, 250);

      // Score
      ctx.fillStyle = '#2ecc71';
      ctx.font = 'bold 48px Arial';
      ctx.fillText(`${percentage}%`, 400, 340);

      ctx.fillStyle = '#aaa';
      ctx.font = '20px Arial';
      ctx.fillText(`${quizScore}/5 bonnes reponses`, 400, 380);

      // Date et jeu
      ctx.fillStyle = '#666';
      ctx.font = '16px Arial';
      ctx.fillText(`Delivre le ${date}`, 400, 480);

      ctx.fillStyle = '#f39c12';
      ctx.font = 'bold 24px Georgia';
      ctx.fillText('DAMESELITE', 400, 530);

      // Telecharger
      const link = document.createElement('a');
      link.download = `certificat-dameselite-${date.replace(/\//g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  }, [quizScore]);

  const handleClose = () => {
    setCurrentStep(0);
    setMode('tutorial');
    setQuizScore(0);
    onClose();
  };

  const handleStartQuiz = () => {
    setMode('quiz');
    setQuizScore(0);
  };

  const handleQuizComplete = () => {
    setMode('certificate');
  };

  const handleRetryQuiz = () => {
    setQuizScore(0);
    setMode('quiz');
  };

  if (!isOpen) return null;

  const step = tutorialSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tutorialSteps.length - 1;
  const IllustrationComponent = step?.illustration;

  return (
    <div className="tutorial-overlay" onClick={handleClose}>
      <div className="tutorial-modal" onClick={(e) => e.stopPropagation()}>
        <button className="tutorial-close" onClick={handleClose}>
          &times;
        </button>

        {mode === 'tutorial' && (
          <>
            <div className="tutorial-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
                />
              </div>
              <span className="progress-text">
                {currentStep + 1} / {tutorialSteps.length}
              </span>
            </div>

            <h2 className="tutorial-title">{t(step.titleKey)}</h2>

            <div className="tutorial-illustration-container">
              {IllustrationComponent && <IllustrationComponent />}
            </div>

            <div className="tutorial-content">
              {t(step.contentKey).split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>

            <div className="tutorial-navigation">
              <button
                className="nav-btn prev"
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={isFirstStep}
              >
                {t('tutorial.previous')}
              </button>

              {isLastStep ? (
                <button className="nav-btn quiz" onClick={handleStartQuiz}>
                  🎯 {t('tutorial.startQuiz', 'Passer le Quiz')}
                </button>
              ) : (
                <button
                  className="nav-btn next"
                  onClick={() => setCurrentStep(currentStep + 1)}
                >
                  {t('tutorial.next')}
                </button>
              )}
            </div>

            <div className="tutorial-dots">
              {tutorialSteps.map((_, index) => (
                <button
                  key={index}
                  className={`dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
                  onClick={() => setCurrentStep(index)}
                />
              ))}
            </div>
          </>
        )}

        {mode === 'quiz' && (
          <TutorialQuiz
            onComplete={handleQuizComplete}
            score={quizScore}
            setScore={setQuizScore}
          />
        )}

        {mode === 'certificate' && (
          <Certificate
            score={quizScore}
            total={5}
            onDownload={generatePDF}
            onClose={quizScore >= 3 ? handleClose : handleRetryQuiz}
          />
        )}
      </div>
    </div>
  );
}

export default Tutorial;
