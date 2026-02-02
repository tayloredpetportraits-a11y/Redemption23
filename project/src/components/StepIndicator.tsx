'use client';

import { Check } from 'lucide-react';

export interface Step {
    number: number;
    label: string;
    status: 'completed' | 'active' | 'inactive';
}

interface StepIndicatorProps {
    steps: Step[];
}

export default function StepIndicator({ steps }: StepIndicatorProps) {
    return (
        <div className="w-full max-w-4xl mx-auto px-4 py-8 fade-in-up">
            <div className="flex items-center justify-between relative">
                {/* Connector Line */}
                <div className="absolute left-0 right-0 top-6 h-0.5 bg-gray-300 -z-10" />
                <div
                    className="absolute left-0 top-6 h-0.5 bg-portal-pink -z-10 transition-all duration-500"
                    style={{
                        width: `${((steps.filter(s => s.status === 'completed').length) / (steps.length - 1)) * 100}%`
                    }}
                />

                {steps.map((step, index) => (
                    <div key={step.number} className="flex flex-col items-center flex-1">
                        {/* Circle */}
                        <div
                            className={`
                w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg
                transition-all duration-300 relative z-10
                ${step.status === 'active' ? 'bg-portal-sky text-white shadow-[0_0_20px_rgba(125,198,255,0.6)]' : ''}
                ${step.status === 'completed' ? 'bg-portal-pink text-white' : ''}
                ${step.status === 'inactive' ? 'bg-gray-300 text-gray-600' : ''}
              `}
                        >
                            {step.status === 'completed' ? (
                                <Check className="w-6 h-6" />
                            ) : (
                                step.number
                            )}
                        </div>

                        {/* Label */}
                        <span
                            className={`
                mt-2 text-xs md:text-sm font-semibold text-center
                ${step.status === 'active' ? 'text-portal-navy' : ''}
                ${step.status === 'completed' ? 'text-portal-navy' : ''}
                ${step.status === 'inactive' ? 'text-gray-500' : ''}
              `}
                        >
                            {step.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
