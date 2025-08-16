import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import adminService from "../../services/adminService";

function SubscriptionManagement() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [operationLoading, setOperationLoading] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading subscription plans...');
      const subscriptionPlans = await adminService.getAllSubscriptionPlans();
      console.log('✅ Plans loaded:', subscriptionPlans);
      setPlans(subscriptionPlans);
    } catch (error) {
      console.error('❌ Error loading plans:', error);
      toast.error('Failed to load subscription plans');
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price, currency = 'INR') => {
    if (price === 0) return 'Free'; // Keep 'Free' as generic term for zero-price plans
    
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const getBillingCycleDisplay = (interval) => {
    const cycles = {
      'month': 'Monthly',
      '3 months': 'Quarterly',
      '6 months': 'Half-Yearly',
      'year': 'Annual'
    };
    return cycles[interval] || interval;
  };

  const PlanCard = ({ plan, planId }) => {
    // All plans are now custom/configurable - no hardcoded base plans
    const isCustomPlan = true;
    const isBasePlan = false;
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              {plan.name}
              {plan.popular && (
                <span className="ml-2 bg-blue-500 text-white px-2 py-1 text-xs rounded-full">
                  Popular
                </span>
              )}
              {plan.specialOffer?.enabled && (
                <span className="ml-2 bg-orange-500 text-white px-2 py-1 text-xs rounded-full">
                  Special Offer
                </span>
              )}
              {isCustomPlan && (
                <span className="ml-2 bg-purple-500 text-white px-2 py-1 text-xs rounded-full">
                  Custom
                </span>
              )}
              {isBasePlan && (
                <span className="ml-2 bg-gray-500 text-white px-2 py-1 text-xs rounded-full">
                  Default
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-500 mt-1">Plan ID: {planId}</p>
            {plan.specialOffer?.enabled && plan.specialOffer.title && (
              <p className="text-sm text-orange-600 font-medium mt-1">
                🎉 {plan.specialOffer.title}
              </p>
            )}
            
            {/* Visibility Status for All Plans */}
            <div className="flex items-center mt-2">
              <span className="text-sm text-gray-600 mr-2">Visibility:</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                plan.visible !== false 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {plan.visible !== false ? 'Visible to Clients' : 'Hidden from Clients'}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col space-y-2">
            {/* Visibility Toggle for All Plans */}
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={plan.visible !== false}
                onChange={(e) => handleVisibilityToggle(planId, e.target.checked)}
                className="sr-only"
              />
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                plan.visible !== false ? 'bg-green-600' : 'bg-gray-300'
              }`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  plan.visible !== false ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </div>
              <span className="ml-2 text-xs text-gray-600">
                {plan.visible !== false ? 'Visible' : 'Hidden'}
              </span>
            </label>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setEditingPlan({ ...plan, id: planId })}
                className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 transition-colors"
              >
                Edit Plan
              </button>
              
              {/* Delete Button for All Plans */}
              <button
                onClick={() => handleDeletePlan(planId, plan.name, isBasePlan)}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  isBasePlan 
                    ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
                title={isBasePlan ? 'Reset to default settings' : 'Delete custom plan'}
              >
                {isBasePlan ? 'Reset' : 'Delete'}
              </button>
            </div>
          </div>
        </div>

      {/* Plan Limits */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600">Invoices/Month (Saves + Exports)</p>
          <p className="font-semibold text-gray-900">
            {plan.monthlyInvoiceLimit === -1 ? 'Unlimited' : plan.monthlyInvoiceLimit}
          </p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600">Clients</p>
          <p className="font-semibold text-gray-900">
            {plan.clientLimit === -1 ? 'Unlimited' : plan.clientLimit}
          </p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600">Products</p>
          <p className="font-semibold text-gray-900">
            {plan.productLimit === -1 ? 'Unlimited' : plan.productLimit}
          </p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600">PDF Exports</p>
          <p className="font-semibold text-gray-900">
            {plan.pdfExportLimit === -1 ? 'Unlimited' : plan.pdfExportLimit}
          </p>
        </div>
      </div>

      {/* Billing Options */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-900 mb-2">Billing Options</h4>
        <div className="space-y-2">
          {Object.entries(plan.billing).map(([cycle, billing]) => (
            <div key={cycle} className="flex justify-between items-center bg-gray-50 p-2 rounded">
              <span className="text-sm font-medium">{getBillingCycleDisplay(billing.interval)}</span>
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  {plan.specialOffer?.enabled && billing.specialOfferPrice && billing.specialOfferPrice < billing.price ? (
                    <div>
                      <span className="text-xs line-through text-gray-400">
                        {formatPrice(billing.price, billing.currency)}
                      </span>
                      <div className="text-sm font-semibold text-orange-600">
                        {formatPrice(billing.specialOfferPrice, billing.currency)}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm font-semibold">
                      {formatPrice(billing.price, billing.currency)}
                    </span>
                  )}
                </div>
                {billing.savings > 0 && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    -{billing.savings}%
                  </span>
                )}
                {plan.specialOffer?.enabled && plan.specialOffer.additionalDiscount > 0 && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                    Extra -{plan.specialOffer.additionalDiscount}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div>
        <h4 className="font-medium text-gray-900 mb-2">Features</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {feature}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  };

  const EditPlanModal = ({ plan, onClose, onSave, loading }) => {
    // Helper function to ensure proper specialOffer structure
    const initializeSpecialOffer = (specialOffer) => {
      const defaultApplicableMonths = {
          january: false,
          february: false,
          march: false,
          april: false,
          may: false,
          june: false,
          july: false,
          august: false,
          september: false,
          october: false,
          november: false,
          december: false
      };

      if (!specialOffer) {
        return {
          enabled: false,
          title: '',
          description: '',
          image: '',
          additionalDiscount: 0,
          applicableMonths: defaultApplicableMonths
        };
      }

      return {
        enabled: specialOffer.enabled || false,
        title: specialOffer.title || '',
        description: specialOffer.description || '',
        image: specialOffer.image || '',
        additionalDiscount: specialOffer.additionalDiscount || 0,
        applicableMonths: {
          ...defaultApplicableMonths,
          ...(specialOffer.applicableMonths || {}),
          ...(specialOffer.months || {}) // Handle both 'months' and 'applicableMonths' from database
        }
      };
    };

    const [formData, setFormData] = useState({
      name: plan.name,
      popular: plan.popular,
      monthlyInvoiceLimit: plan.monthlyInvoiceLimit,
      clientLimit: plan.clientLimit,
      productLimit: plan.productLimit,
      pdfExportLimit: plan.pdfExportLimit,
      features: [...(plan.features || [])],
      billing: { ...plan.billing },
      specialOffer: initializeSpecialOffer(plan.specialOffer)
    });

    const [newFeature, setNewFeature] = useState('');

    const handleInputChange = (field, value) => {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    };

    const handleBillingChange = (cycle, field, value) => {
      setFormData(prev => {
        const updatedBilling = {
          ...prev.billing,
          [cycle]: {
            ...prev.billing[cycle],
            [field]: field === 'price' ? Number(value) : (field === 'savings' ? Number(value) : value)
          }
        };

        // Auto-calculate savings percentage when price is changed
        if (field === 'price') {
          if (cycle !== 'monthly') {
            // Calculate savings for the specific cycle
            const monthlyPrice = prev.billing.monthly.price;
            const newPrice = Number(value);
            
            if (monthlyPrice > 0 && newPrice >= 0) {
              let expectedPrice = monthlyPrice;
              
              // Calculate expected price based on billing cycle
              switch (cycle) {
                case 'quarterly':
                  expectedPrice = monthlyPrice * 3;
                  break;
                case 'halfYearly':
                  expectedPrice = monthlyPrice * 6;
                  break;
                case 'annual':
                  expectedPrice = monthlyPrice * 12;
                  break;
                default:
                  expectedPrice = monthlyPrice;
              }
              
              // Calculate savings percentage
              const savings = expectedPrice > newPrice 
                ? Math.round(((expectedPrice - newPrice) / expectedPrice) * 100)
                : 0;
              
              updatedBilling[cycle].savings = savings;
            } else {
              updatedBilling[cycle].savings = 0;
            }
          } else {
            // If monthly price changed, recalculate all other cycles' savings
            const newMonthlyPrice = Number(value);
            
            if (newMonthlyPrice > 0) {
              ['quarterly', 'halfYearly', 'annual'].forEach(otherCycle => {
                if (updatedBilling[otherCycle]) {
                  let expectedPrice = newMonthlyPrice;
                  
                  switch (otherCycle) {
                    case 'quarterly':
                      expectedPrice = newMonthlyPrice * 3;
                      break;
                    case 'halfYearly':
                      expectedPrice = newMonthlyPrice * 6;
                      break;
                    case 'annual':
                      expectedPrice = newMonthlyPrice * 12;
                      break;
                    default:
                      expectedPrice = newMonthlyPrice;
                      break;
                  }
                  
                  const currentPrice = updatedBilling[otherCycle].price;
                  if (currentPrice >= 0) {
                    const savings = expectedPrice > currentPrice 
                      ? Math.round(((expectedPrice - currentPrice) / expectedPrice) * 100)
                      : 0;
                    
                    updatedBilling[otherCycle].savings = savings;
                  } else {
                    updatedBilling[otherCycle].savings = 0;
                  }
                }
              });
            } else {
              // Reset savings for all cycles if monthly price is 0 or invalid
              ['quarterly', 'halfYearly', 'annual'].forEach(otherCycle => {
                if (updatedBilling[otherCycle]) {
                  updatedBilling[otherCycle].savings = 0;
                }
              });
            }
          }
        }

        // Auto-calculate price when savings percentage is changed
        if (field === 'savings' && cycle !== 'monthly') {
          const monthlyPrice = prev.billing.monthly.price;
          const savingsPercentage = Number(value);
          
          if (monthlyPrice > 0 && savingsPercentage >= 0 && savingsPercentage <= 100) {
            let expectedPrice = monthlyPrice;
            
            // Calculate expected price based on billing cycle
            switch (cycle) {
              case 'quarterly':
                expectedPrice = monthlyPrice * 3;
                break;
              case 'halfYearly':
                expectedPrice = monthlyPrice * 6;
                break;
              case 'annual':
                expectedPrice = monthlyPrice * 12;
                break;
              default:
                expectedPrice = monthlyPrice;
            }
            
            // Calculate discounted price based on savings percentage
            const discountedPrice = Math.round(expectedPrice * (1 - savingsPercentage / 100));
            updatedBilling[cycle].price = discountedPrice;
          } else if (savingsPercentage === 0) {
            // If savings is 0, set price to expected full price
            let expectedPrice = monthlyPrice;
            
            switch (cycle) {
              case 'quarterly':
                expectedPrice = monthlyPrice * 3;
                break;
              case 'halfYearly':
                expectedPrice = monthlyPrice * 6;
                break;
              case 'annual':
                expectedPrice = monthlyPrice * 12;
                break;
              default:
                expectedPrice = monthlyPrice;
            }
            
            updatedBilling[cycle].price = expectedPrice;
          }
        }

        return {
          ...prev,
          billing: updatedBilling
        };
      });
    };

    const addFeature = () => {
      if (newFeature.trim()) {
        setFormData(prev => ({
          ...prev,
          features: [...prev.features, newFeature.trim()]
        }));
        setNewFeature('');
      }
    };

    const removeFeature = (index) => {
      setFormData(prev => ({
        ...prev,
        features: prev.features.filter((_, i) => i !== index)
      }));
    };

    const handleSpecialOfferChange = (field, value) => {
      setFormData(prev => {
        const updatedFormData = {
        ...prev,
        specialOffer: {
          ...prev.specialOffer,
          [field]: value
        }
        };

      // Auto-calculate discounted prices when additional discount changes
      if (field === 'additionalDiscount') {
        const additionalDiscount = Number(value);
        if (additionalDiscount >= 0 && additionalDiscount <= 100) {
            const updatedBilling = { ...prev.billing };
          
          Object.keys(updatedBilling).forEach(cycle => {
              if (updatedBilling[cycle] && updatedBilling[cycle].price) {
            const originalPrice = updatedBilling[cycle].price;
            const discountedPrice = Math.round(originalPrice * (1 - additionalDiscount / 100));
            updatedBilling[cycle].specialOfferPrice = discountedPrice;
              }
          });

            updatedFormData.billing = updatedBilling;
        }
      }

        return updatedFormData;
      });
    };

    const handleMonthToggle = (month) => {
      setFormData(prev => ({
        ...prev,
        specialOffer: {
          ...prev.specialOffer,
          applicableMonths: {
            ...prev.specialOffer.applicableMonths,
            [month]: !prev.specialOffer.applicableMonths[month]
          }
        }
      }));
    };

    const handleImageUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          handleSpecialOfferChange('image', e.target.result);
        };
        reader.readAsDataURL(file);
      }
    };

    const handleSave = async () => {
      if (loading) return;
      
      try {
        await onSave(plan.id, formData);
        // Modal will be closed by the parent component after successful save
      } catch (error) {
        // Error handling is done in the parent component
        console.error('Error in modal save:', error);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Edit {plan.name} Plan</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Plan Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="popular"
                    checked={formData.popular}
                    onChange={(e) => handleInputChange('popular', e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="popular" className="text-sm font-medium text-gray-700">
                    Mark as Popular
                  </label>
                </div>

                {/* Plan Limits */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Invoice Operations Limit (Saves + Exports)
                    </label>
                    <input
                      type="number"
                      value={formData.monthlyInvoiceLimit}
                      onChange={(e) => handleInputChange('monthlyInvoiceLimit', parseInt(e.target.value) || -1)}
                      placeholder="-1 for unlimited"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Controls both invoice saves and PDF exports (combined limit)
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client Limit</label>
                    <input
                      type="number"
                      value={formData.clientLimit}
                      onChange={(e) => handleInputChange('clientLimit', parseInt(e.target.value) || -1)}
                      placeholder="-1 for unlimited"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Limit</label>
                    <input
                      type="number"
                      value={formData.productLimit}
                      onChange={(e) => handleInputChange('productLimit', parseInt(e.target.value) || -1)}
                      placeholder="-1 for unlimited"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PDF Export Limit</label>
                    <input
                      type="number"
                      value={formData.pdfExportLimit}
                      onChange={(e) => handleInputChange('pdfExportLimit', parseInt(e.target.value) || -1)}
                      placeholder="-1 for unlimited"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
                <div className="space-y-2 mb-3">
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm">{feature}</span>
                      <button
                        onClick={() => removeFeature(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="Add new feature"
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                  />
                  <button
                    onClick={addFeature}
                    className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Billing Options */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Billing Options</h3>
              <p className="text-sm text-gray-600 mb-4">
                💡 <strong>Smart Pricing:</strong> Enter either the price OR savings percentage - the other will be calculated automatically based on the monthly rate.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(formData.billing).map(([cycle, billing]) => (
                  <div key={cycle} className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">{getBillingCycleDisplay(billing.interval)}</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price (INR)</label>
                        <input
                          type="number"
                          value={billing.price}
                          onChange={(e) => handleBillingChange(cycle, 'price', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Savings % {cycle === 'monthly' && '(Not applicable)'}
                        </label>
                        <input
                          type="number"
                          value={billing.savings}
                          onChange={(e) => handleBillingChange(cycle, 'savings', parseInt(e.target.value) || 0)}
                          readOnly={cycle === 'monthly'}
                          min="0"
                          max="100"
                          className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            cycle === 'monthly' ? 'bg-gray-100 cursor-not-allowed' : ''
                          }`}
                          placeholder={cycle === 'monthly' ? 'N/A' : 'Enter savings %'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Razorpay Plan ID</label>
                        <input
                          type="text"
                          value={billing.razorpayPlanId || ''}
                          onChange={(e) => handleBillingChange(cycle, 'razorpayPlanId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={`plan_${cycle}_${plan.name.toLowerCase()}_inr`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Special Offers Section */}
            <div className="mt-8 border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Special Offers</h3>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.specialOffer.enabled}
                    onChange={(e) => handleSpecialOfferChange('enabled', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Enable Special Offers</span>
                </label>
              </div>

              {formData.specialOffer.enabled && (
                <div className="space-y-6 bg-orange-50 p-6 rounded-lg border border-orange-200">
                  {/* Offer Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Offer Title</label>
                      <input
                        type="text"
                        value={formData.specialOffer.title}
                        onChange={(e) => handleSpecialOfferChange('title', e.target.value)}
                        placeholder="e.g., Holiday Special, Black Friday Deal"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Additional Discount %</label>
                      <input
                        type="number"
                        value={formData.specialOffer.additionalDiscount}
                        onChange={(e) => handleSpecialOfferChange('additionalDiscount', e.target.value)}
                        min="0"
                        max="100"
                        placeholder="Enter additional discount"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.specialOffer.description}
                      onChange={(e) => handleSpecialOfferChange('description', e.target.value)}
                      rows="3"
                      placeholder="Describe your special offer..."
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Offer Image</label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                      />
                      {formData.specialOffer.image && (
                        <div className="relative">
                          <img
                            src={formData.specialOffer.image}
                            alt="Offer preview"
                            className="w-20 h-20 object-cover rounded-md border border-gray-300"
                          />
                          <button
                            onClick={() => handleSpecialOfferChange('image', '')}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Month Toggles */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Applicable Months</label>
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {formData.specialOffer?.applicableMonths && Object.entries(formData.specialOffer.applicableMonths).map(([month, isActive]) => (
                        <label key={month} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={isActive}
                            onChange={() => handleMonthToggle(month)}
                            className="mr-2"
                          />
                          <span className="text-sm capitalize">{month.slice(0, 3)}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Special Offer Pricing Preview */}
                  {formData.specialOffer.additionalDiscount > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Special Offer Pricing Preview</h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        {Object.entries(formData.billing).map(([cycle, billing]) => (
                          <div key={cycle} className="bg-white p-3 rounded border border-orange-200">
                            <div className="text-xs text-gray-600 mb-1">{getBillingCycleDisplay(billing.interval)}</div>
                            <div className="text-sm">
                              <span className="line-through text-gray-400">{formatPrice(billing.price)}</span>
                              <div className="text-orange-600 font-semibold">
                                {formatPrice(billing.specialOfferPrice || billing.price)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleSavePlan = async (planId, updatedPlan) => {
    if (operationLoading) return;
    
    try {
      setOperationLoading(true);
      console.log('🔄 Updating plan:', planId, updatedPlan);
      
      // Update the plan using the admin service
      await adminService.updateSubscriptionPlan(planId, updatedPlan);
      
      // Reload plans to get updated data
      await loadPlans();
      
      // Close the modal after successful update
      setEditingPlan(null);
      
      toast.success(`${updatedPlan.name} plan updated successfully!`);
    } catch (error) {
      console.error('❌ Error updating plan:', error);
      toast.error('Failed to update plan');
    } finally {
      setOperationLoading(false);
    }
  };

  const handleAddPlan = async (newPlan) => {
    if (operationLoading) return;
    
    try {
      setOperationLoading(true);
      console.log('🔄 Creating new plan:', newPlan);
      
      // Add the plan using the admin service
      await adminService.addSubscriptionPlan(newPlan);
      
      // Reload plans to get updated data
      await loadPlans();
      
      // Close the modal after successful creation
      setShowAddPlan(false);
      
      toast.success(`${newPlan.name} plan created successfully!`);
    } catch (error) {
      console.error('❌ Error creating plan:', error);
      toast.error('Failed to create plan');
    } finally {
      setOperationLoading(false);
    }
  };

  const handleVisibilityToggle = async (planId, isVisible) => {
    if (operationLoading) return;
    
    try {
      setOperationLoading(true);
      // Find the current plan
      const currentPlan = plans.find(p => p.id === planId);
      if (!currentPlan) {
        toast.error('Plan not found');
        return;
      }
      
      const updatedPlan = { ...currentPlan, visible: isVisible };
      
      // Update the plan using the admin service
      await adminService.updateSubscriptionPlan(planId, updatedPlan);
      
      // Reload plans to get updated data instead of local state update
      await loadPlans();
      
      toast.success(`${currentPlan.name} plan ${isVisible ? 'shown to' : 'hidden from'} clients`);
      console.log('Plan visibility updated:', planId, isVisible);
    } catch (error) {
      console.error('Error updating plan visibility:', error);
      toast.error('Failed to update plan visibility');
    } finally {
      setOperationLoading(false);
    }
  };

  const handleDeletePlan = (planId, planName, isBasePlan = false) => {
    const actionText = isBasePlan ? 'reset' : 'delete';
    const confirmMessage = isBasePlan 
      ? `Are you sure you want to reset the "${planName}" plan to its default settings? All customizations will be lost.`
      : `Are you sure you want to delete the "${planName}" plan? This action cannot be undone.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        if (isBasePlan) {
          // For base plans, remove any customizations to reset to defaults
          const storedPlans = localStorage.getItem('custom_subscription_plans');
          if (storedPlans) {
            const customPlans = JSON.parse(storedPlans);
            delete customPlans[planId];
            localStorage.setItem('custom_subscription_plans', JSON.stringify(customPlans));
          }
          
          // Reload plans to get fresh defaults
          loadPlans();
          toast.success(`${planName} plan reset to default settings!`);
          console.log('Plan reset to defaults:', planId);
        } else {
          // For custom plans, completely remove them
          const storedPlans = localStorage.getItem('custom_subscription_plans');
          if (storedPlans) {
            const customPlans = JSON.parse(storedPlans);
            delete customPlans[planId];
            localStorage.setItem('custom_subscription_plans', JSON.stringify(customPlans));
          }
          
          // Update local state
          setPlans(prev => {
            const newPlans = { ...prev };
            delete newPlans[planId];
            return newPlans;
          });
          
          toast.success(`${planName} plan deleted successfully!`);
          console.log('Plan deleted:', planId);
        }
      } catch (error) {
        console.error(`Error ${actionText}ing plan:`, error);
        toast.error(`Failed to ${actionText} plan`);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-96 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscription Management</h1>
              <p className="text-gray-600">Manage subscription plans, pricing, and features</p>
            </div>
            <button
              onClick={() => setShowAddPlan(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add New Plan
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        {plans.length === 0 && !loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Subscription Plans Found</h3>
            <p className="text-gray-600 mb-4">
              No subscription plans have been set up yet. Create your first plan to get started.
            </p>
            <button
              onClick={() => setShowAddPlan(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Create First Plan
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} planId={plan.id} />
            ))}
          </div>
        )}

        {/* Edit Plan Modal */}
        {editingPlan && (
          <EditPlanModal
            plan={editingPlan}
            onClose={() => !operationLoading && setEditingPlan(null)}
            onSave={handleSavePlan}
            loading={operationLoading}
          />
        )}

        {/* Add Plan Modal */}
        {showAddPlan && (
          <AddPlanModal
            onClose={() => !operationLoading && setShowAddPlan(false)}
            onSave={handleAddPlan}
            getBillingCycleDisplay={getBillingCycleDisplay}
            formatPrice={formatPrice}
            loading={operationLoading}
          />
        )}
      </div>
    </div>
  );
}

// Add Plan Modal Component
const AddPlanModal = ({ onClose, onSave, getBillingCycleDisplay, formatPrice, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    popular: false,
    monthlyInvoiceLimit: 10,
    clientLimit: 10,
    productLimit: 10,
    pdfExportLimit: 10,
    features: [],
    billing: {
      monthly: { 
        price: 0, 
        currency: 'INR', 
        interval: 'month',
        usageLimit: 10,
        razorpayPlanId: '',
        savings: 0 
      },
      quarterly: { 
        price: 0, 
        currency: 'INR', 
        interval: '3 months',
        usageLimit: 30,
        razorpayPlanId: '',
        savings: 0 
      },
      halfYearly: { 
        price: 0, 
        currency: 'INR', 
        interval: '6 months',
        usageLimit: 60,
        razorpayPlanId: '',
        savings: 0 
      },
      annual: { 
        price: 0, 
        currency: 'INR', 
        interval: 'year',
        usageLimit: 120,
        razorpayPlanId: '',
        savings: 0 
      }
    },
    specialOffer: {
      enabled: false,
      title: '',
      description: '',
      image: '',
      additionalDiscount: 0,
      applicableMonths: {
        january: false,
        february: false,
        march: false,
        april: false,
        may: false,
        june: false,
        july: false,
        august: false,
        september: false,
        october: false,
        november: false,
        december: false
      }
    }
  });

  const [newFeature, setNewFeature] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBillingChange = (cycle, field, value) => {
    setFormData(prev => {
      const updatedBilling = {
        ...prev.billing,
        [cycle]: {
          ...prev.billing[cycle],
          [field]: field === 'price' ? Number(value) : (field === 'savings' ? Number(value) : value)
        }
      };

      // Auto-calculate savings percentage when price is changed
      if (field === 'price') {
        if (cycle !== 'monthly') {
          // Calculate savings for the specific cycle
          const monthlyPrice = prev.billing.monthly.price;
          const newPrice = Number(value);
          
          if (monthlyPrice > 0 && newPrice >= 0) {
            let expectedPrice = monthlyPrice;
            
            // Calculate expected price based on billing cycle
            switch (cycle) {
              case 'quarterly':
                expectedPrice = monthlyPrice * 3;
                break;
              case 'halfYearly':
                expectedPrice = monthlyPrice * 6;
                break;
              case 'annual':
                expectedPrice = monthlyPrice * 12;
                break;
              default:
                expectedPrice = monthlyPrice;
            }
            
            // Calculate savings percentage
            const savings = expectedPrice > newPrice 
              ? Math.round(((expectedPrice - newPrice) / expectedPrice) * 100)
              : 0;
            
            updatedBilling[cycle].savings = savings;
          } else {
            updatedBilling[cycle].savings = 0;
          }
        } else {
          // If monthly price changed, recalculate all other cycles' savings
          const newMonthlyPrice = Number(value);
          
          if (newMonthlyPrice > 0) {
            ['quarterly', 'halfYearly', 'annual'].forEach(otherCycle => {
              if (updatedBilling[otherCycle]) {
                let expectedPrice = newMonthlyPrice;
                
                switch (otherCycle) {
                  case 'quarterly':
                    expectedPrice = newMonthlyPrice * 3;
                    break;
                  case 'halfYearly':
                    expectedPrice = newMonthlyPrice * 6;
                    break;
                  case 'annual':
                    expectedPrice = newMonthlyPrice * 12;
                    break;
                  default:
                    expectedPrice = newMonthlyPrice;
                    break;
                }
                
                const currentPrice = updatedBilling[otherCycle].price;
                if (currentPrice >= 0) {
                  const savings = expectedPrice > currentPrice 
                    ? Math.round(((expectedPrice - currentPrice) / expectedPrice) * 100)
                    : 0;
                    
                  updatedBilling[otherCycle].savings = savings;
                } else {
                  updatedBilling[otherCycle].savings = 0;
                }
              }
            });
          } else {
            // Reset savings for all cycles if monthly price is 0 or invalid
            ['quarterly', 'halfYearly', 'annual'].forEach(otherCycle => {
              if (updatedBilling[otherCycle]) {
                updatedBilling[otherCycle].savings = 0;
              }
            });
          }
        }
      }

      // Auto-calculate price when savings percentage is changed
      if (field === 'savings' && cycle !== 'monthly') {
        const monthlyPrice = prev.billing.monthly.price;
        const savingsPercentage = Number(value);
        
        if (monthlyPrice > 0 && savingsPercentage >= 0 && savingsPercentage <= 100) {
          let expectedPrice = monthlyPrice;
          
          // Calculate expected price based on billing cycle
          switch (cycle) {
            case 'quarterly':
              expectedPrice = monthlyPrice * 3;
              break;
            case 'halfYearly':
              expectedPrice = monthlyPrice * 6;
              break;
            case 'annual':
              expectedPrice = monthlyPrice * 12;
              break;
            default:
              expectedPrice = monthlyPrice;
          }
          
          // Calculate discounted price based on savings percentage
          const discountedPrice = Math.round(expectedPrice * (1 - savingsPercentage / 100));
          updatedBilling[cycle].price = discountedPrice;
        } else if (savingsPercentage === 0) {
          // If savings is 0, set price to expected full price
          let expectedPrice = monthlyPrice;
          
          switch (cycle) {
            case 'quarterly':
              expectedPrice = monthlyPrice * 3;
              break;
            case 'halfYearly':
              expectedPrice = monthlyPrice * 6;
              break;
            case 'annual':
              expectedPrice = monthlyPrice * 12;
              break;
            default:
              expectedPrice = monthlyPrice;
          }
          
          updatedBilling[cycle].price = expectedPrice;
        }
      }

      return {
        ...prev,
        billing: updatedBilling
      };
    });
  };

  const handleSpecialOfferChange = (field, value) => {
    setFormData(prev => {
      const updatedFormData = {
      ...prev,
      specialOffer: {
        ...prev.specialOffer,
        [field]: value
      }
      };

    // Auto-calculate discounted prices when additional discount changes
    if (field === 'additionalDiscount') {
      const additionalDiscount = Number(value);
      if (additionalDiscount >= 0 && additionalDiscount <= 100) {
          const updatedBilling = { ...prev.billing };
        
        Object.keys(updatedBilling).forEach(cycle => {
            if (updatedBilling[cycle] && updatedBilling[cycle].price) {
          const originalPrice = updatedBilling[cycle].price;
          const discountedPrice = Math.round(originalPrice * (1 - additionalDiscount / 100));
          updatedBilling[cycle].specialOfferPrice = discountedPrice;
            }
        });

          updatedFormData.billing = updatedBilling;
        }
      }

        return updatedFormData;
      });
    };

  const handleMonthToggle = (month) => {
    setFormData(prev => ({
      ...prev,
      specialOffer: {
        ...prev.specialOffer,
        applicableMonths: {
          ...prev.specialOffer.applicableMonths,
          [month]: !prev.specialOffer.applicableMonths[month]
        }
      }
    }));
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        handleSpecialOfferChange('image', e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    if (loading) return;
    
    if (!formData.name.trim()) {
      toast.error('Plan name is required');
      return;
    }
    if (formData.billing.monthly.price < 0) {
      toast.error('Monthly price cannot be negative');
      return;
    }
    
    try {
      await onSave(formData);
      // Modal will be closed by the parent component after successful save
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Error in modal save:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Add New Subscription Plan</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Plan Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Premium, Enterprise"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="popular"
                  checked={formData.popular}
                  onChange={(e) => handleInputChange('popular', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="popular" className="text-sm font-medium text-gray-700">
                  Mark as Popular
                </label>
              </div>

              {/* Plan Limits */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice Operations Limit (Saves + Exports)
                  </label>
                  <input
                    type="number"
                    value={formData.monthlyInvoiceLimit}
                    onChange={(e) => handleInputChange('monthlyInvoiceLimit', parseInt(e.target.value) || -1)}
                    placeholder="-1 for unlimited"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Controls both invoice saves and PDF exports (combined limit)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Limit</label>
                  <input
                    type="number"
                    value={formData.clientLimit}
                    onChange={(e) => handleInputChange('clientLimit', parseInt(e.target.value) || -1)}
                    placeholder="-1 for unlimited"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Limit</label>
                  <input
                    type="number"
                    value={formData.productLimit}
                    onChange={(e) => handleInputChange('productLimit', parseInt(e.target.value) || -1)}
                    placeholder="-1 for unlimited"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PDF Export Limit</label>
                  <input
                    type="number"
                    value={formData.pdfExportLimit}
                    onChange={(e) => handleInputChange('pdfExportLimit', parseInt(e.target.value) || -1)}
                    placeholder="-1 for unlimited"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Features */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
              <div className="space-y-2 mb-3">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm">{feature}</span>
                    <button
                      onClick={() => removeFeature(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Add new feature"
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                />
                <button
                  onClick={addFeature}
                  className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Billing Options */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Billing Options</h3>
            <p className="text-sm text-gray-600 mb-4">
              💡 <strong>Smart Pricing:</strong> Enter either the price OR savings percentage - the other will be calculated automatically based on the monthly rate.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(formData.billing).map(([cycle, billing]) => (
                <div key={cycle} className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">{getBillingCycleDisplay(billing.interval)}</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price (INR)</label>
                      <input
                        type="number"
                        value={billing.price}
                        onChange={(e) => handleBillingChange(cycle, 'price', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Savings % {cycle === 'monthly' && '(Not applicable)'}
                      </label>
                      <input
                        type="number"
                        value={billing.savings}
                        onChange={(e) => handleBillingChange(cycle, 'savings', parseInt(e.target.value) || 0)}
                        readOnly={cycle === 'monthly'}
                        min="0"
                        max="100"
                        className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          cycle === 'monthly' ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                        placeholder={cycle === 'monthly' ? 'N/A' : 'Enter savings %'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Razorpay Plan ID</label>
                      <input
                        type="text"
                        value={billing.razorpayPlanId || ''}
                        onChange={(e) => handleBillingChange(cycle, 'razorpayPlanId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`plan_${cycle}_${formData.name ? formData.name.toLowerCase().replace(/\s+/g, '_') : 'planname'}_inr`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Special Offers Section */}
          <div className="mt-8 border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Special Offers</h3>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.specialOffer.enabled}
                  onChange={(e) => handleSpecialOfferChange('enabled', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Enable Special Offers</span>
              </label>
            </div>

            {formData.specialOffer.enabled && (
              <div className="space-y-6 bg-orange-50 p-6 rounded-lg border border-orange-200">
                {/* Offer Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Offer Title</label>
                    <input
                      type="text"
                      value={formData.specialOffer.title}
                      onChange={(e) => handleSpecialOfferChange('title', e.target.value)}
                      placeholder="e.g., Holiday Special, Black Friday Deal"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Additional Discount %</label>
                    <input
                      type="number"
                      value={formData.specialOffer.additionalDiscount}
                      onChange={(e) => handleSpecialOfferChange('additionalDiscount', e.target.value)}
                      min="0"
                      max="100"
                      placeholder="Enter additional discount"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.specialOffer.description}
                    onChange={(e) => handleSpecialOfferChange('description', e.target.value)}
                    rows="3"
                    placeholder="Describe your special offer..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Offer Image</label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                    />
                    {formData.specialOffer.image && (
                      <div className="relative">
                        <img
                          src={formData.specialOffer.image}
                          alt="Offer preview"
                          className="w-20 h-20 object-cover rounded-md border border-gray-300"
                        />
                        <button
                          onClick={() => handleSpecialOfferChange('image', '')}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Month Toggles */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Applicable Months</label>
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {formData.specialOffer?.applicableMonths && Object.entries(formData.specialOffer.applicableMonths).map(([month, isActive]) => (
                      <label key={month} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={() => handleMonthToggle(month)}
                          className="mr-2"
                        />
                        <span className="text-sm capitalize">{month.slice(0, 3)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Special Offer Pricing Preview */}
                {formData.specialOffer.additionalDiscount > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Special Offer Pricing Preview</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      {Object.entries(formData.billing).map(([cycle, billing]) => (
                        <div key={cycle} className="bg-white p-3 rounded border border-orange-200">
                          <div className="text-xs text-gray-600 mb-1">{getBillingCycleDisplay(billing.interval)}</div>
                          <div className="text-sm">
                            <span className="line-through text-gray-400">{formatPrice(billing.price)}</span>
                            <div className="text-orange-600 font-semibold">
                              {formatPrice(billing.specialOfferPrice || billing.price)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {loading ? 'Creating...' : 'Create Plan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManagement; 