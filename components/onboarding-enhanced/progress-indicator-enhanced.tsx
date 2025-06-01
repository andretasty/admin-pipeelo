import { Check } from "lucide-react"

interface ProgressIndicatorEnhancedProps {
  currentStep: number
  totalSteps: number
  stepTitles: string[]
}

export default function ProgressIndicatorEnhanced({
  currentStep,
  totalSteps,
  stepTitles,
}: ProgressIndicatorEnhancedProps) {
  return (
    <div className="mb-8">
      {/* Progress Bar Container */}
      <div className="relative">
        {/* Step Circles and Titles */}
        <div className="grid grid-cols-6 gap-2 mb-6">
          {Array.from({ length: totalSteps }, (_, index) => {
            const stepNumber = index + 1
            const isCompleted = stepNumber < currentStep
            const isCurrent = stepNumber === currentStep

            return (
              <div key={stepNumber} className="flex flex-col items-center">
                <div
                  className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                  transition-all duration-300 shadow-sm mb-2 relative z-10
                  ${isCompleted || isCurrent ? "text-white" : "text-gray-500 bg-white border-2 border-gray-200"}
                `}
                  style={{
                    backgroundColor: isCompleted || isCurrent ? "#01D5AC" : undefined,
                    boxShadow: isCompleted || isCurrent ? "0 2px 4px rgba(1, 213, 172, 0.2)" : undefined,
                  }}
                >
                  {isCompleted ? <Check size={16} /> : stepNumber}
                </div>

                {/* Step Title */}
                <div
                  className={`text-xs font-medium text-center transition-colors duration-200 ${
                    isCompleted || isCurrent ? "text-[#01D5AC]" : "text-gray-500"
                  }`}
                >
                  {stepTitles[index]}
                </div>
              </div>
            )
          })}
        </div>

        {/* Connection Lines */}
        <div className="absolute top-5 left-[20px] right-[20px]">
          <div className="flex items-center justify-between">
            {Array.from({ length: totalSteps - 1 }, (_, index) => {
              const stepNumber = index + 1
              const lineWidth = `calc(100% / ${totalSteps - 1})`

              return (
                <div
                  key={stepNumber}
                  className={`
                  h-1 rounded-full transition-all duration-300
                  ${stepNumber < currentStep ? "bg-gradient-to-r from-[#01D5AC] to-[#00C49A]" : "bg-gray-200"}
                `}
                  style={{
                    width: lineWidth,
                  }}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
