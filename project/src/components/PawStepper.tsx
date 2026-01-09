'use client';

import { motion } from 'framer-motion';
import { PawPrint, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface PawStepperProps {
    currentStep: number;
    steps: string[];
    className?: string;
}

export function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

export default function PawStepper({ currentStep, steps, className }: PawStepperProps) {
    return (
        <div className={cn("w-full max-w-3xl mx-auto mb-12", className)}>
            <div className="relative flex items-center justify-between">
                {/* Connecting Line */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-zinc-200 rounded-full -z-10">
                    <motion.div
                        className="h-full bg-brand-navy rounded-full"
                        initial={{ width: '0%' }}
                        animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                    />
                </div>

                {steps.map((step, index) => {
                    const stepNum = index + 1;
                    const isActive = stepNum === currentStep;
                    const isCompleted = stepNum < currentStep;

                    return (
                        <div key={step} className="flex flex-col items-center gap-2">
                            <motion.div
                                initial={false}
                                animate={{
                                    scale: isActive ? 1.1 : 1,
                                    backgroundColor: isActive || isCompleted ? '#101123' : '#FFFFFF',
                                    borderColor: isActive || isCompleted ? '#101123' : '#E4E4E7',
                                }}
                                className={cn(
                                    "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors relative z-10",
                                    isActive && "ring-4 ring-brand-navy/20 shadow-lg"
                                )}
                            >
                                {isCompleted ? (
                                    <Check className="w-5 h-5 text-white font-bold" />
                                ) : (
                                    <PawPrint
                                        className={cn(
                                            "w-5 h-5",
                                            isActive ? "text-white" : "text-zinc-300"
                                        )}
                                    />
                                )}
                            </motion.div>
                            <span
                                className={cn(
                                    "text-xs font-bold uppercase tracking-wider absolute -bottom-8 w-32 text-center transition-colors duration-300",
                                    isActive ? "text-brand-navy" : isCompleted ? "text-brand-navy/60" : "text-zinc-400"
                                )}
                            >
                                {step}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
