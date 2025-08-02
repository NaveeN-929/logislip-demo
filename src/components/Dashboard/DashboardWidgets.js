import React, { useEffect } from "react";
import LottieMoney from "../LotiIcon/LottieMoney";
import LottieProduct from "../LotiIcon/LottieProduct";
import LottieInvoice from "../LotiIcon/LottieInvoice";
import LottiePersons from "../LotiIcon/LottiePersons";
import { useSelector } from "react-redux";
import { getAllClientsSelector } from "../../store/clientSlice";
import { getAllProductSelector } from "../../store/productSlice";
import {
  getAllInvoiceSelector,
  getTotalBalance,
} from "../../store/invoiceSlice";
import NumberFormat from "react-number-format";
import useSubscriptionLimits from "../../hooks/useSubscriptionLimits";

import userService from "../../services/userService";

function DashboardWidgets() {
  const clients = useSelector(getAllClientsSelector) || [];
  const products = useSelector(getAllProductSelector) || [];
  const totalBalance = useSelector(getTotalBalance) || 0;
  const allInvoices = useSelector(getAllInvoiceSelector) || [];
  const { getCurrentPlan, usageCounts, loadUsageCounts } = useSubscriptionLimits();

  
  const user = userService.getCurrentUser();
  const currentPlan = getCurrentPlan();
  
  // Get current usage counts from Supabase (real-time)
  const exportCount = usageCounts.invoice_exports || 0;
  
  // Refresh usage counts periodically to ensure real-time updates
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      loadUsageCounts();
    }, 2000); // Refresh every 2 seconds for real-time feel
    
    // Also refresh immediately when component mounts
    loadUsageCounts();
    
    return () => clearInterval(refreshInterval);
  }, [loadUsageCounts]);
  
  // Refresh when user changes (login/logout)
  useEffect(() => {
    if (user) {
      loadUsageCounts();
    }
  }, [user, loadUsageCounts]);



  // Get usage percentage for each resource
  const getUsagePercentage = (current, limit) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((current / limit) * 100, 100);
  };

  const clientsPercentage = getUsagePercentage(clients.length, currentPlan.limitations.clients);
  const productsPercentage = getUsagePercentage(products.length, currentPlan.limitations.products);
  const invoicesPercentage = getUsagePercentage(allInvoices.length, currentPlan.limitations.invoicesSaveExport);
  const exportsPercentage = getUsagePercentage(exportCount, currentPlan.limitations.invoicesSaveExport);

  return (
    <div className="space-y-4">
      {/* Subscription Plan Info */}
      {user && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {currentPlan.name} Plan
              </h3>
              <p className="text-sm text-gray-600">
                Current usage limits and restrictions
              </p>
            </div>
          </div>
          
          {/* Usage Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {/* Clients */}
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Clients</div>
              <div className="text-lg font-bold text-gray-900">
                {clients.length}
                {currentPlan.limitations.clients !== -1 && (
                  <span className="text-sm text-gray-500">/{currentPlan.limitations.clients}</span>
                )}
              </div>
              {currentPlan.limitations.clients !== -1 && (
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className={`h-2 rounded-full ${
                      clientsPercentage >= 100 ? 'bg-red-500' : 
                      clientsPercentage >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${clientsPercentage}%` }}
                  ></div>
                </div>
              )}
            </div>

            {/* Products */}
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Products</div>
              <div className="text-lg font-bold text-gray-900">
                {products.length}
                {currentPlan.limitations.products !== -1 && (
                  <span className="text-sm text-gray-500">/{currentPlan.limitations.products}</span>
                )}
              </div>
              {currentPlan.limitations.products !== -1 && (
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className={`h-2 rounded-full ${
                      productsPercentage >= 100 ? 'bg-red-500' : 
                      productsPercentage >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${productsPercentage}%` }}
                  ></div>
                </div>
              )}
            </div>

            {/* Invoices */}
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Invoices</div>
              <div className="text-lg font-bold text-gray-900">
                {allInvoices.length}
                {currentPlan.limitations.invoicesSaveExport !== -1 && (
                  <span className="text-sm text-gray-500">/{currentPlan.limitations.invoicesSaveExport}</span>
                )}
              </div>
              {currentPlan.limitations.invoicesSaveExport !== -1 && (
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className={`h-2 rounded-full ${
                      invoicesPercentage >= 100 ? 'bg-red-500' : 
                      invoicesPercentage >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${invoicesPercentage}%` }}
                  ></div>
                </div>
              )}
            </div>

            {/* Exports */}
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Exports</div>
              <div className="text-lg font-bold text-gray-900">
                {exportCount}
                {currentPlan.limitations.invoicesSaveExport !== -1 && (
                  <span className="text-sm text-gray-500">/{currentPlan.limitations.invoicesSaveExport}</span>
                )}
              </div>
              {currentPlan.limitations.invoicesSaveExport !== -1 && (
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className={`h-2 rounded-full ${
                      exportsPercentage >= 100 ? 'bg-red-500' : 
                      exportsPercentage >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${exportsPercentage}%` }}
                  ></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Original widgets */}
      <div className="flex flex-wrap">
        <div className="w-full sm:w-1/2 lg:w-1/4 px-2 mb-4">
          <div className="bg-white rounded-xl px-3 py-3 h-28">
            <div className="flex flex-row">
              <div className="flex-1 self-center">
                <h5 className="text-gray-600 font-bold text-sm">
                  Total Clients
                </h5>
                <h1 className="text-gray-700 font-bold text-xl">
                  {clients.length}
                </h1>
              </div>
              <div className="flex-1 self-center">
                <LottiePersons />
              </div>
            </div>
          </div>
        </div>

        <div className="w-full sm:w-1/2 lg:w-1/4 px-2 mb-4">
          <div className="bg-white rounded-xl px-3 py-3 h-28">
            <div className="flex flex-row">
              <div className="flex-1 self-center">
                <h5 className="text-gray-600 font-bold text-sm">
                  Total Products
                </h5>
                <h1 className="text-gray-700 font-bold text-xl">
                  {products.length}
                </h1>
              </div>
              <div className="flex-1 self-center">
                <LottieProduct />
              </div>
            </div>
          </div>
        </div>

        <div className="w-full sm:w-1/2 lg:w-1/4 px-2 mb-4">
          <div className="bg-white rounded-xl px-3 py-3 h-28">
            <div className="flex flex-row">
              <div className="flex-1 self-center">
                <h5 className="text-gray-600 font-bold text-sm">Total Balance</h5>
                <h1 className="text-gray-700 font-bold text-xl">
                <NumberFormat
                    value={totalBalance}
                  className=""
                  displayType={"text"}
                  thousandSeparator={true}
                    prefix={"₹"}
                  renderText={(value, props) => <span {...props}>{value}</span>}
                />
                </h1>
              </div>
              <div className="flex-1 self-center">
                <LottieMoney />
              </div>
            </div>
          </div>
        </div>

        <div className="w-full sm:w-1/2 lg:w-1/4 px-2 mb-4">
          <div className="bg-white rounded-xl px-3 py-3 h-28">
            <div className="flex flex-row">
              <div className="flex-1 self-center">
                <h5 className="text-gray-600 font-bold text-sm">
                  Total Invoices
                </h5>
                <h1 className="text-gray-700 font-bold text-xl">
                  {allInvoices.length}
                </h1>
              </div>
              <div className="flex-1 self-center">
                <LottieInvoice />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardWidgets;
