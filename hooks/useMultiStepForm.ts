"use client";

import { useState } from "react";

interface UseMultiStepFormProps {
  totalSteps: number;
  initialStep?: number;
  onStepChange?: (step: number) => void;
}

export function useMultiStepForm({
  totalSteps,
  initialStep = 1,
  onStepChange,
}: UseMultiStepFormProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);

  const nextStep = () => {
    if (currentStep < totalSteps) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      onStepChange?.(newStep);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      onStepChange?.(newStep);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
      onStepChange?.(step);
    }
  };

  const resetSteps = () => {
    setCurrentStep(initialStep);
    onStepChange?.(initialStep);
  };

  return {
    currentStep,
    totalSteps,
    nextStep,
    prevStep,
    goToStep,
    resetSteps,
    isFirstStep: currentStep === 1,
    isLastStep: currentStep === totalSteps,
    progress: (currentStep / totalSteps) * 100,
  };
}
