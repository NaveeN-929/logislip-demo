import React from "react";
import Button from "../../Button/Button";
import DatePicker from "react-datepicker";
import { numberToWords } from "../../../utils/numberToWords";
import ClientPlusIcon from "../../Icons/ClientPlusIcon";
import PlusCircleIcon from "../../Icons/PlusCircleIcon";
import InvoiceIcon from "../../Icons/InvoiceIcon";
import DollarIcon from "../../Icons/DollarIcon";
import DeleteIcon from "../../Icons/DeleteIcon";
import TaxesIcon from "../../Icons/TaxesIcon";

const IconStyle = { top: -2, position: "relative", marginRight: 2 };

function ModernTemplate({
  invoiceForm,
  isViewMode,
  isExporting,
  setInvoiceForm,
  handlerInvoiceValue,
  handlerInvoiceClientValue,
  handlerProductValue,
  handlerTaxesValue,
  openChooseClient,
  addEmptyProduct,
  openChooseProduct,
  addCGSTSGST,
  addIGST,
  addEmptyTax,
  onDeleteProduct,
  onDeleteTax,
  sumProductTotal
}) {
  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-4 bg-white modern-template-wrapper" style={{ aspectRatio: '3/4' }}>
      {/* Header Section - Portrait Layout */}
      <div className="border-b-2 pb-4" style={{ borderColor: invoiceForm?.color || '#3B82F6' }}>
        {/* Company Information with Invoice Title */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4 flex-1">
            {invoiceForm?.companyDetail?.image && (
              <img
                className="object-contain h-16 w-16 rounded-lg shadow-md"
                alt={invoiceForm?.companyDetail?.companyName}
                src={invoiceForm?.companyDetail?.image}
              />
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800">
                {invoiceForm?.companyDetail?.companyName || "Company Name"}
              </h1>
              <div className="text-sm text-gray-600 space-y-1">
                <div>
                  {invoiceForm?.companyDetail?.billingAddress || "Company Address"}
                </div>
                <div>
                  {invoiceForm?.companyDetail?.companyEmail || "company@email.com"}
                </div>
                <div>
                  {invoiceForm?.companyDetail?.companyMobile || "+1234567890"}
                </div>
                <div className="text-xs text-gray-500 space-y-0.5 mt-2">
                  <div>
                    <span className="font-medium">GSTIN:</span> {invoiceForm?.companyDetail?.companyGST || "GST Number"}
                  </div>
                  <div>
                    <span className="font-medium">UDYAM:</span> {invoiceForm?.companyDetail?.companyUDYAM || "UDYAM Number"}
                  </div>
                  <div>
                    <span className="font-medium">SAC:</span> {invoiceForm?.companyDetail?.companySAC || "SAC Number"}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Invoice Title - Top Right Corner */}
          <div className="text-right">
            <h2 className="text-2xl font-bold" style={{ color: invoiceForm?.color || '#3B82F6' }}>INVOICE</h2>
          </div>
        </div>
      </div>

      {/* Client Information with Invoice Details */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-800">Bill To:</h3>
              {!isViewMode && (
                <Button size="sm" outlined={1} onClick={openChooseClient}>
                  <ClientPlusIcon style={IconStyle} className="w-4 h-4" /> Choose Existing Client
                </Button>
              )}
            </div>
            <div className="text-sm space-y-1">
              <div className="font-semibold">
                {!isViewMode ? (
                  <input
                    autoComplete="nope"
                    placeholder="Client Name"
                    className="border-none p-0 text-sm font-semibold focus:outline-none bg-transparent"
                    value={invoiceForm?.clientDetail?.name || ""}
                    onChange={(e) => handlerInvoiceClientValue(e, "name")}
                  />
                ) : (
                  invoiceForm?.clientDetail?.name || "Client Name"
                )}
              </div>
              <div>
                {!isViewMode ? (
                  <input
                    autoComplete="nope"
                    placeholder="Client Address"
                    className="border-none p-0 text-sm focus:outline-none bg-transparent"
                    value={invoiceForm?.clientDetail?.billingAddress || ""}
                    onChange={(e) => handlerInvoiceClientValue(e, "billingAddress")}
                  />
                ) : (
                  invoiceForm?.clientDetail?.billingAddress || "Client Address"
                )}
              </div>
              <div>
                {!isViewMode ? (
                  <input
                    autoComplete="nope"
                    placeholder="client@email.com"
                    className="border-none p-0 text-sm focus:outline-none bg-transparent"
                    value={invoiceForm?.clientDetail?.email || ""}
                    onChange={(e) => handlerInvoiceClientValue(e, "email")}
                  />
                ) : (
                  invoiceForm?.clientDetail?.email || "client@email.com"
                )}
              </div>
              <div>
                {!isViewMode ? (
                  <input
                    autoComplete="nope"
                    placeholder="+1234567890"
                    className="border-none p-0 text-sm focus:outline-none bg-transparent"
                    value={invoiceForm?.clientDetail?.mobileNo || ""}
                    onChange={(e) => handlerInvoiceClientValue(e, "mobileNo")}
                  />
                ) : (
                  invoiceForm?.clientDetail?.mobileNo || "+1234567890"
                )}
              </div>
            </div>
          </div>
          
          {/* Invoice Details - Right Corner */}
          <div className="p-4 rounded-lg min-w-[300px]" style={{ backgroundColor: invoiceForm?.color ? `${invoiceForm.color}15` : '#EFF6FF' }}>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700 min-w-[80px]">Invoice #:</span>
                <div className="flex-1 text-right">
                  {!isViewMode ? (
                    <input
                      autoComplete="nope"
                      placeholder="INV-001"
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                      value={invoiceForm.invoiceNo || ""}
                      onChange={(e) => handlerInvoiceValue(e, "invoiceNo")}
                    />
                  ) : (
                    <span className="font-medium">{invoiceForm.invoiceNo || "INV-001"}</span>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700 min-w-[80px]">Date:</span>
                <div className="flex-1 text-right">
                  {!isViewMode ? (
                    <DatePicker
                      selected={invoiceForm.createdDate}
                      onChange={(date) => handlerInvoiceValue(date.toISOString(), "createdDate")}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                      dateFormat="dd/MM/yyyy"
                    />
                  ) : (
                    <span className="font-medium">{new Date(invoiceForm.createdDate).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700 min-w-[80px]">Due Date:</span>
                <div className="flex-1 text-right">
                  {!isViewMode ? (
                    <DatePicker
                      selected={invoiceForm.dueDate}
                      onChange={(date) => handlerInvoiceValue(date.toISOString(), "dueDate")}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                      dateFormat="dd/MM/yyyy"
                    />
                  ) : (
                    <span className="font-medium">{new Date(invoiceForm.dueDate).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead style={{ backgroundColor: invoiceForm?.color ? `${invoiceForm.color}15` : '#EFF6FF' }}>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Description</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Qty</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Price</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Total</th>
              {!isViewMode && (
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Action</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {invoiceForm?.products?.map((product, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-3">
                  {!isViewMode ? (
                    product.productID ? (
                      <input
                        autoComplete="nope"
                        value={product.name}
                        placeholder="Product Name"
                        className="w-full border-none p-0 text-sm focus:outline-none bg-transparent"
                        onChange={(e) => handlerProductValue(e, "name", product.id)}
                      />
                    ) : (
                      <textarea
                        autoComplete="nope"
                        value={product.name}
                        placeholder="Product Description"
                        className="w-full border-none p-0 text-sm focus:outline-none bg-transparent resize-none"
                        rows={2}
                        onChange={(e) => handlerProductValue(e, "name", product.id)}
                      />
                    )
                  ) : (
                    <span className="text-sm whitespace-pre-wrap">{product.name || "Product Name"}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {!isViewMode ? (
                    <input
                      autoComplete="nope"
                      value={product.quantity}
                      type="number"
                      placeholder="1"
                      className="w-full border-none p-0 text-sm text-center focus:outline-none bg-transparent"
                      onChange={(e) => handlerProductValue(e, "quantity", product.id)}
                    />
                  ) : (
                    <span className="text-sm">{product.quantity || 1}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {!isViewMode ? (
                    <input
                      autoComplete="nope"
                      value={product.amount}
                      type="number"
                      placeholder="0.00"
                      className="w-full border-none p-0 text-sm text-center focus:outline-none bg-transparent"
                      onChange={(e) => handlerProductValue(e, "amount", product.id)}
                    />
                  ) : (
                    <span className="text-sm">{invoiceForm?.currencyUnit || '₹'}{(product.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-sm font-semibold">{invoiceForm?.currencyUnit || '₹'}{((product.quantity || 1) * (product.amount || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </td>
                {!isViewMode && (
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onDeleteProduct(product.id)}
                      className="text-red-500 hover:text-red-700 focus:outline-none"
                    >
                      <DeleteIcon className="h-4 w-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Product Management Buttons */}
      {!isViewMode && (
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <Button size="sm" block={1} onClick={addEmptyProduct}>
              <PlusCircleIcon style={IconStyle} className="w-4 h-4" /> Add Empty Product
            </Button>
          </div>
          <div className="flex-1">
            <Button size="sm" block={1} onClick={openChooseProduct}>
              <InvoiceIcon style={IconStyle} className="w-4 h-4" /> Add Existing Product
            </Button>
          </div>
        </div>
      )}

      {/* Tax Management Buttons */}
      {!isViewMode && (
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <Button size="sm" block={1} onClick={addCGSTSGST}>
              <TaxesIcon style={IconStyle} className="w-4 h-4" /> CGST + SGST (2.5% each)
            </Button>
          </div>
          <div className="flex-1">
            <Button size="sm" block={1} onClick={addIGST}>
              <TaxesIcon style={IconStyle} className="w-4 h-4" /> IGST (Editable %)
            </Button>
          </div>
          <div className="flex-1">
            <Button size="sm" block={1} onClick={addEmptyTax}>
              <DollarIcon style={IconStyle} className="w-4 h-4" /> Add Extra Fee
            </Button>
          </div>
        </div>
      )}

      {/* Individual Tax Items - Only show in edit mode */}
      {!isViewMode && invoiceForm?.taxes?.map((tax, index) => (
        <div key={`${index}_${tax.id}`} className="flex justify-end">
          <div className="w-1/2 bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{tax.title}:</span>
                <input
                  autoComplete="nope"
                  value={tax.value}
                  type="number"
                  placeholder="Value"
                  className="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => handlerTaxesValue(e, "value", tax.id)}
                />
                <span className="text-sm font-medium">
                  {tax.type === "percentage" ? "%" : invoiceForm.currencyUnit}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-sm font-medium">
                    {invoiceForm?.currencyUnit || '₹'}{(tax.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <button
                  onClick={() => onDeleteTax(tax.id)}
                  className="text-red-500 hover:text-red-700 focus:outline-none"
                >
                  <DeleteIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Totals Section */}
      <div className="flex justify-end">
        <div className="w-1/3 p-4 rounded-lg" style={{ backgroundColor: invoiceForm?.color ? `${invoiceForm.color}15` : '#EFF6FF' }}>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{invoiceForm?.currencyUnit || '₹'}{(sumProductTotal(invoiceForm?.products || [])).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            {invoiceForm?.taxes?.map((tax, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{tax.title}:</span>
                <span>{invoiceForm?.currencyUnit || '₹'}{(tax.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>{invoiceForm?.currencyUnit || '₹'}{(invoiceForm?.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Amount in Words */}
      <div className="p-4 rounded-lg" style={{ backgroundColor: invoiceForm?.color ? `${invoiceForm.color}15` : '#EFF6FF' }}>
        <div className="text-sm">
          <strong>Amount in words:</strong> {numberToWords(invoiceForm?.totalAmount || 0)} Only
        </div>
      </div>

      {/* Bank Details and Signature - Integrated Layout */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-start gap-6">
          {/* Bank Details Section */}
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Bank Details:</h3>
            <div className="text-sm text-gray-600 leading-relaxed space-y-1">
              {(invoiceForm?.companyDetail?.accountName || !isViewMode) && (
                <div>
                  <span className="font-medium">A/c Name:</span> {!isViewMode ? (
                    <input
                      autoComplete="nope"
                      placeholder="Account Name"
                      className="border-none p-0 text-sm focus:outline-none bg-transparent ml-1"
                      value={invoiceForm?.companyDetail?.accountName || ""}
                      onChange={(e) => setInvoiceForm(prev => ({ ...prev, companyDetail: { ...prev.companyDetail, accountName: e.target.value } }))}
                    />
                  ) : (
                    invoiceForm?.companyDetail?.accountName
                  )}
                </div>
              )}
              {(invoiceForm?.companyDetail?.accountNumber || !isViewMode) && (
                <div>
                  <span className="font-medium">A/c Number:</span> {!isViewMode ? (
                    <input
                      autoComplete="nope"
                      placeholder="Account Number"
                      className="border-none p-0 text-sm focus:outline-none bg-transparent ml-1"
                      value={invoiceForm?.companyDetail?.accountNumber || ""}
                      onChange={(e) => setInvoiceForm(prev => ({ ...prev, companyDetail: { ...prev.companyDetail, accountNumber: e.target.value } }))}
                    />
                  ) : (
                    invoiceForm?.companyDetail?.accountNumber
                  )}
                </div>
              )}
              {(invoiceForm?.companyDetail?.bankName || !isViewMode) && (
                <div>
                  <span className="font-medium">Bank Name:</span> {!isViewMode ? (
                    <input
                      autoComplete="nope"
                      placeholder="Bank Name"
                      className="border-none p-0 text-sm focus:outline-none bg-transparent ml-1"
                      value={invoiceForm?.companyDetail?.bankName || ""}
                      onChange={(e) => setInvoiceForm(prev => ({ ...prev, companyDetail: { ...prev.companyDetail, bankName: e.target.value } }))}
                    />
                  ) : (
                    invoiceForm?.companyDetail?.bankName
                  )}
                </div>
              )}
              {(invoiceForm?.companyDetail?.branchName || invoiceForm?.companyDetail?.branch || !isViewMode) && (
                <div>
                  <span className="font-medium">Branch:</span> {!isViewMode ? (
                    <input
                      autoComplete="nope"
                      placeholder="Branch"
                      className="border-none p-0 text-sm focus:outline-none bg-transparent ml-1"
                      value={invoiceForm?.companyDetail?.branchName || invoiceForm?.companyDetail?.branch || ""}
                      onChange={(e) => setInvoiceForm(prev => ({ 
                        ...prev, 
                        companyDetail: { 
                          ...prev.companyDetail, 
                          branchName: e.target.value,
                          branch: e.target.value 
                        } 
                      }))}
                    />
                  ) : (
                    invoiceForm?.companyDetail?.branchName || invoiceForm?.companyDetail?.branch
                  )}
                </div>
              )}
              {(invoiceForm?.companyDetail?.ifscCode || !isViewMode) && (
                <div>
                  <span className="font-medium">IFSC Code:</span> {!isViewMode ? (
                    <input
                      autoComplete="nope"
                      placeholder="IFSC Code"
                      className="border-none p-0 text-sm focus:outline-none bg-transparent ml-1"
                      value={invoiceForm?.companyDetail?.ifscCode || ""}
                      onChange={(e) => setInvoiceForm(prev => ({ ...prev, companyDetail: { ...prev.companyDetail, ifscCode: e.target.value } }))}
                    />
                  ) : (
                    invoiceForm?.companyDetail?.ifscCode
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Signature Section */}
          <div className="w-1/3 min-w-[200px]">
            <div className="text-right">
              <div className="text-sm font-semibold mb-4">For {invoiceForm?.companyDetail?.companyName || "Company"}</div>
              <div className="flex flex-col items-end">
                {invoiceForm?.companyDetail?.sealImage && (
                  <img
                    className="object-contain h-16 w-16 mb-2"
                    alt="Company Seal"
                    src={invoiceForm.companyDetail.sealImage}
                  />
                )}
                <div className="text-xs">Authorized Signature</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes Section */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Notes:</h3>
        {!isViewMode ? (
          <textarea
            autoComplete="nope"
            placeholder="Thank you for your business! Payment is due within 30 days."
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
            value={invoiceForm?.notes || ""}
            onChange={(e) => handlerInvoiceValue(e, "notes")}
          />
        ) : (
          <p className="text-sm text-gray-600">{invoiceForm?.notes || "Thank you for your business! Payment is due within 30 days."}</p>
        )}
      </div>
    </div>
  );
}

export default ModernTemplate; 