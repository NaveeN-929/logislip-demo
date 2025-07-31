import React from "react";
import useSubscriptionLimits from "../../hooks/useSubscriptionLimits";

const allTemplates = [
  { id: 'default', name: 'Default Template', description: 'Modern colorful layout', planRequired: 'free' },
  { id: 'modern', name: 'Modern Template', description: 'Clean modern design with full features', planRequired: 'pro' },
  { id: 'formal', name: 'Formal Template', description: 'Professional business layout', planRequired: 'pro' }
];

function TemplateSelector({ 
  currentTemplate, 
  onTemplateChange, 
  isViewMode = false 
}) {
  const { getAvailableTemplates, getCurrentPlan } = useSubscriptionLimits();
  
  const currentPlan = getCurrentPlan();
  const availableTemplateIds = getAvailableTemplates();
  const selectedTemplate = currentTemplate;

  // Show all templates for viewing, but restrict saving to available ones
  const availableTemplates = allTemplates;
  
  const currentIndex = availableTemplates.findIndex(t => t.id === currentTemplate);
  
  const goToPrevious = () => {
    if (availableTemplates.length <= 1) return;
    const newIndex = currentIndex > 0 ? currentIndex - 1 : availableTemplates.length - 1;
    const newTemplate = availableTemplates[newIndex];
    
    // Allow template switching for viewing, but warn about save restrictions
    onTemplateChange(newTemplate.id);
  };

  const goToNext = () => {
    if (availableTemplates.length <= 1) return;
    const newIndex = currentIndex < availableTemplates.length - 1 ? currentIndex + 1 : 0;
    const newTemplate = availableTemplates[newIndex];
    
    // Allow template switching for viewing, but warn about save restrictions
    onTemplateChange(newTemplate.id);
  };

  if (isViewMode) return null;

  return (
    <div className="flex items-center justify-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200 mb-4">
      {/* Left Arrow */}
      <button
        onClick={goToPrevious}
        disabled={availableTemplates.length <= 1}
        className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Previous template"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Template Info */}
      <div className="text-center">
        <div className="font-semibold text-gray-800">
          {availableTemplates[currentIndex]?.name || 'Default Template'}
        </div>
        <div className="text-sm text-gray-600">
          {availableTemplates[currentIndex]?.description || 'Modern colorful layout'}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {currentIndex + 1} of {availableTemplates.length}
        </div>
        
        {/* Plan-based template save restrictions */}
        {currentPlan.id === 'free' && selectedTemplate !== 'default' && (
          <div className="text-xs text-orange-600 mt-1 bg-orange-50 px-2 py-1 rounded">
            ⚠️ Preview only - Save requires Default template or upgrade
          </div>
        )}
        {currentPlan.id === 'free' && selectedTemplate === 'default' && (
          <div className="text-xs text-green-600 mt-1 bg-green-50 px-2 py-1 rounded">
            ✅ Template available for saving
          </div>
        )}
        {currentPlan.id === 'pro' && !availableTemplateIds.includes(selectedTemplate) && (
          <div className="text-xs text-orange-600 mt-1 bg-orange-50 px-2 py-1 rounded">
            ⚠️ Preview only - Save requires Business plan upgrade
          </div>
        )}
        {currentPlan.id === 'pro' && availableTemplateIds.includes(selectedTemplate) && (
          <div className="text-xs text-blue-600 mt-1 bg-blue-50 px-2 py-1 rounded">
            ✅ Template available for saving
          </div>
        )}
        {currentPlan.id === 'business' && (
          <div className="text-xs text-green-600 mt-1 bg-green-50 px-2 py-1 rounded">
            ✅ All templates available
          </div>
        )}
      </div>

      {/* Right Arrow */}
      <button
        onClick={goToNext}
        disabled={availableTemplates.length <= 1}
        className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Next template"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

export default TemplateSelector; 