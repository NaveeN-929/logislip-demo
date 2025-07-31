import React from 'react'
import subscriptionService from '../../services/subscriptionService'

const PlanComparisonTable = () => {
  const plans = subscriptionService.getSubscriptionPlans()
  const planArray = Object.values(plans)

  const comparisonFeatures = [
    {
      category: 'Usage Limits',
      features: [
        {
          label: 'Invoices Save & Export',
          key: 'invoicesSaveExport',
          format: (value) => value === -1 ? 'Unlimited' : value
        },
        {
          label: 'Clients',
          key: 'clients',
          format: (value) => value === -1 ? 'Unlimited' : value
        },
        {
          label: 'Products',
          key: 'products',
          format: (value) => value === -1 ? 'Unlimited' : value
        }
      ]
    },
    {
      category: 'Export Options',
      features: [
        {
          label: 'PDF Export',
          key: 'exportFormats',
          format: (formats) => formats.includes('pdf') ? '✅' : '❌'
        },
        {
          label: 'Drive Export',
          key: 'exportToDrive',
          format: (value) => value ? '✅' : '❌'
        },
        {
          label: 'CSV Export',
          key: 'exportFormats',
          format: (formats) => formats.includes('csv') ? '✅' : '❌'
        },
        {
          label: 'Excel Export',
          key: 'exportFormats',
          format: (formats) => formats.includes('xlsx') ? '✅' : '❌'
        },
        {
          label: 'JSON Export',
          key: 'exportFormats',
          format: (formats) => formats.includes('json') ? '✅' : '❌'
        }
      ]
    },
    {
      category: 'Sync & Sharing',
      features: [
        {
          label: 'Auto-Sync Frequency',
          key: 'autoSyncFrequency',
          format: (value) => {
            switch (value) {
              case 'manual': return 'Manual only'
              case '30min': return 'Every 30 minutes'
              case '5min': return 'Every 5 minutes'
              default: return value
            }
          }
        },
        {
          label: 'Email Sharing',
          key: 'emailShare',
          format: (value) => value ? '✅' : '❌'
        }
      ]
    },
    {
      category: 'Templates & Customization',
      features: [
        {
          label: 'Default Template',
          key: 'templateAccess',
          format: (templates) => templates.includes('default') ? '✅' : '❌'
        },
        {
          label: 'Modern Template',
          key: 'templateAccess',
          format: (templates) => templates.includes('modern') ? '✅' : '❌'
        },
        {
          label: 'Formal Template',
          key: 'templateAccess',
          format: (templates) => templates.includes('formal') ? '✅' : '❌'
        },
        {
          label: 'Custom Templates',
          key: 'customTemplates',
          format: (value) => value ? '✅' : '❌'
        }
      ]
    },
    {
      category: 'Support',
      features: [
        {
          label: 'Support Level',
          key: 'supportLevel',
          format: (value) => {
            switch (value) {
              case 'none': return 'No support'
              case 'email': return 'Email support'
              case 'priority': return 'Priority support'
              default: return value
            }
          }
        }
      ]
    }
  ]

  const formatPlanName = (plan) => {
    return (
      <div className="text-center">
        <div className="font-semibold text-lg">{plan.name}</div>
        <div className="text-sm text-gray-500">
          ₹{plan.billing.monthly.price}/month
        </div>
        {plan.popular && (
          <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full mt-1">
            Most Popular
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mt-8">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white rounded-lg shadow">
          {/* Header */}
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">
                Features
              </th>
              {planArray.map((plan) => (
                <th key={plan.id} className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-900">
                  {formatPlanName(plan)}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {comparisonFeatures.map((category, categoryIndex) => (
              <React.Fragment key={categoryIndex}>
                {/* Category Header */}
                <tr className="bg-gray-25">
                  <td colSpan={planArray.length + 1} className="border border-gray-200 px-4 py-2 font-semibold text-gray-800 bg-gray-100">
                    {category.category}
                  </td>
                </tr>
                
                {/* Category Features */}
                {category.features.map((feature, featureIndex) => (
                  <tr key={`${categoryIndex}-${featureIndex}`} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 font-medium text-gray-700">
                      {feature.label}
                    </td>
                    {planArray.map((plan) => (
                      <td key={plan.id} className="border border-gray-200 px-4 py-3 text-center">
                        <span className="font-medium">
                          {feature.format(plan.limitations[feature.key])}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Note */}
      <div className="mt-4 text-sm text-gray-600 text-center">
        <p>💡 All plans include secure data storage and Google Drive backup</p>
      </div>
    </div>
  )
}

export default PlanComparisonTable 