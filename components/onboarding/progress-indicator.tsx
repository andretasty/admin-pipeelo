import { Check } from "lucide-react"

interface ProgressIndicatorProps {
  currentStep: number
  totalSteps: number
}

export default function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  return (
    <div className="flex items-center justify-center space-x-6 section-spacing">
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNumber = index + 1
        const isCompleted = stepNumber < currentStep
        const isCurrent = stepNumber === currentStep

        return (
          <div key={stepNumber} className="flex items-center">
            <div
              className={`
                w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold
                transition-all duration-300 shadow-sm
                ${isCompleted || isCurrent ? "text-white" : "text-gray-500 bg-white border-2 border-gray-200"}
              `}
              style={{
                backgroundColor: isCompleted || isCurrent ? "#01D5AC" : undefined,
                boxShadow: isCompleted || isCurrent ? "0 2px 4px rgba(1, 213, 172, 0.2)" : undefined,
              }}
            >
              {isCompleted ? <Check size={18} /> : stepNumber}
            </div>
            {stepNumber < totalSteps && (
              <div
                className={`
                  w-16 h-1 mx-4 rounded-full transition-all duration-300
                  ${stepNumber < currentStep ? "bg-gradient-to-r from-[#01D5AC] to-[#00C49A]" : "bg-gray-200"}
                `}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
