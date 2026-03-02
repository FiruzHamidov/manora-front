'use client';

import { ReactNode } from 'react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export function StepIndicator({
  currentStep,
  totalSteps,
  className = '',
}: StepIndicatorProps) {
  return (
    <div className={`flex items-center justify-center mb-8 ${className}`}>
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm  ${
              step === currentStep
                ? 'bg-[#0036A5] text-white'
                : step < currentStep
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {step < currentStep ? '✓' : step}
          </div>
          {step < totalSteps && (
            <div
              className={`w-12 h-1 mx-2 ${
                step < currentStep ? 'bg-green-500' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

interface FormStepperProps {
  currentStep: number;
  totalSteps: number;
  children: ReactNode;
  title?: string;
  className?: string;
}

export function FormStepper({
  currentStep,
  totalSteps,
  children,
  title,
  className = '',
}: FormStepperProps) {
  return (
    <div className={`mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8 mx-auto py-8 bg-white rounded-lg ${className}`}>
      {title && (
        <h1 className="text-2xl font-bold mb-6 text-center">{title}</h1>
      )}

      <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />

      <div className="max-w-4xl mx-auto">{children}</div>
    </div>
  );
}
