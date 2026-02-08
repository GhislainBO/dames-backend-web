/**
 * Tutorial - Mode tutoriel interactif
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './Tutorial.css';

interface TutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

function Tutorial({ isOpen, onClose }: TutorialProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);

  const tutorialSteps = [
    { titleKey: 'tutorial.step1Title', contentKey: 'tutorial.step1Content' },
    { titleKey: 'tutorial.step2Title', contentKey: 'tutorial.step2Content' },
    { titleKey: 'tutorial.step3Title', contentKey: 'tutorial.step3Content' },
    { titleKey: 'tutorial.step4Title', contentKey: 'tutorial.step4Content' },
    { titleKey: 'tutorial.step5Title', contentKey: 'tutorial.step5Content' },
    { titleKey: 'tutorial.step6Title', contentKey: 'tutorial.step6Content' },
    { titleKey: 'tutorial.step7Title', contentKey: 'tutorial.step7Content' },
    { titleKey: 'tutorial.step8Title', contentKey: 'tutorial.step8Content' },
    { titleKey: 'tutorial.step9Title', contentKey: 'tutorial.step9Content' },
    { titleKey: 'tutorial.step10Title', contentKey: 'tutorial.step10Content' },
    { titleKey: 'tutorial.step11Title', contentKey: 'tutorial.step11Content' },
    { titleKey: 'tutorial.step12Title', contentKey: 'tutorial.step12Content' },
  ];

  if (!isOpen) return null;

  const step = tutorialSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tutorialSteps.length - 1;

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  return (
    <div className="tutorial-overlay" onClick={handleClose}>
      <div className="tutorial-modal" onClick={(e) => e.stopPropagation()}>
        <button className="tutorial-close" onClick={handleClose}>
          &times;
        </button>

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

        <div className="tutorial-content">
          {t(step.contentKey).split('\n').map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>

        <div className="tutorial-navigation">
          <button
            className="nav-btn prev"
            onClick={handlePrevious}
            disabled={isFirstStep}
          >
            {t('tutorial.previous')}
          </button>

          {isLastStep ? (
            <button className="nav-btn finish" onClick={handleClose}>
              {t('tutorial.finish')}
            </button>
          ) : (
            <button className="nav-btn next" onClick={handleNext}>
              {t('tutorial.next')}
            </button>
          )}
        </div>

        <div className="tutorial-dots">
          {tutorialSteps.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentStep ? 'active' : ''}`}
              onClick={() => setCurrentStep(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Tutorial;
