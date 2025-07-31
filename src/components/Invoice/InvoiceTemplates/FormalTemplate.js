import React from "react";
import Button from "../../Button/Button";
import DatePicker from "react-datepicker";
import NumberFormat from "react-number-format";
import { numberToWords } from "../../../utils/numberToWords";

import ClientPlusIcon from "../../Icons/ClientPlusIcon";
import PlusCircleIcon from "../../Icons/PlusCircleIcon";
import InvoiceIcon from "../../Icons/InvoiceIcon";
import DollarIcon from "../../Icons/DollarIcon";
import DeleteIcon from "../../Icons/DeleteIcon";
import TaxesIcon from "../../Icons/TaxesIcon";

const IconStyle = { top: -2, position: "relative", marginRight: 2 };

function FormalTemplate({
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
    <>
      {/* Template Header for Formal Template */}
      <div className="border-b-2 border-black bg-white mb-4">
        <div className="flex justify-between items-center p-3">
          <div className="text-sm font-bold" style={{ color: invoiceForm?.color || '#3B82F6' }}>
            TAX INVOICE
          </div>
          <div className="text-xs text-gray-700">
            ORIGINAL FOR RECIPIENT
          </div>
        </div>
      </div>

      <div className={isExporting ? "w-full space-y-4" : "w-full p-4 space-y-4"}>
        {/* Company Details and Invoice Details Row for Formal Template */}
        <div className="flex justify-between mb-6">
          <div className="w-2/3">
            <div className="border-2 border-black p-3">
              <div className="text-base font-bold mb-2">
                {invoiceForm?.companyDetail?.companyName || "Company Name"}
              </div>
              <div className="text-xs space-y-1">
                <div>
                  {invoiceForm?.companyDetail?.billingAddress || "Company Address"}
                </div>
                <div>
                  <span className="font-bold">Ph:</span> {invoiceForm?.companyDetail?.companyMobile || "Phone Number"}
                </div>
                <div>
                  <span className="font-bold">Email:</span> {invoiceForm?.companyDetail?.companyEmail || "Email"}
                </div>
                <div>
                  <span className="font-bold">GSTIN:</span> {invoiceForm?.companyDetail?.companyGST || "GST Number"}
                </div>
                <div>
                  <span className="font-bold">UDYAM:</span> {invoiceForm?.companyDetail?.companyUDYAM || "UDYAM Number"}
                </div>
                <div>
                  <span className="font-bold">SAC:</span> {invoiceForm?.companyDetail?.companySAC || "SAC Number"}
                </div>
              </div>
            </div>
          </div>

          <div className="w-1/3 ml-4">
            <div className="border-2 border-black p-3">
              <div className="text-xs space-y-2">
                <div>
                  <span className="font-bold">Invoice No:</span> {!isViewMode ? (
                    <input
                      autoComplete="nope"
                      placeholder="INV-001"
                      className="w-full border-b border-gray-400 px-1 text-xs focus:outline-none bg-transparent mt-1"
                      value={invoiceForm.invoiceNo || ""}
                      onChange={(e) => handlerInvoiceValue(e, "invoiceNo")}
                    />
                  ) : (
                    <div className="mt-1">{invoiceForm.invoiceNo || "INV-001"}</div>
                  )}
                </div>
                <div>
                  <span className="font-bold">Invoice Date:</span> {!isViewMode ? (
                    <DatePicker
                      selected={invoiceForm.createdDate}
                      onChange={(date) => handlerInvoiceValue(date.toISOString(), "createdDate")}
                      className="w-full border-b border-gray-400 px-1 text-xs focus:outline-none bg-transparent mt-1"
                      dateFormat="dd/MM/yyyy"
                    />
                  ) : (
                    <div className="mt-1">{new Date(invoiceForm.createdDate).toLocaleDateString()}</div>
                  )}
                </div>
                <div>
                  <span className="font-bold">Due Date:</span> {!isViewMode ? (
                    <DatePicker
                      selected={invoiceForm.dueDate}
                      onChange={(date) => handlerInvoiceValue(date.toISOString(), "dueDate")}
                      className="w-full border-b border-gray-400 px-1 text-xs focus:outline-none bg-transparent mt-1"
                      dateFormat="dd/MM/yyyy"
                    />
                  ) : (
                    <div className="mt-1">{new Date(invoiceForm.dueDate).toLocaleDateString()}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bill To Section */}
        <div className="mb-6">
          <div className="border-2 border-black p-3">
            <div className="text-sm font-bold mb-2 border-b border-black pb-1">BILL TO:</div>
            <div className="text-xs space-y-1">
              <div className="font-bold">
                {!isViewMode ? (
                  <input
                    autoComplete="nope"
                    placeholder="Customer Name"
                    className="w-full border-none p-0 text-xs font-bold focus:outline-none bg-transparent"
                    value={invoiceForm?.clientDetail?.name || ""}
                    onChange={(e) => handlerInvoiceClientValue(e, "name")}
                  />
                ) : (
                  invoiceForm?.clientDetail?.name || "Customer Name"
                )}
              </div>
              <div>
                {!isViewMode ? (
                  <input
                    autoComplete="nope"
                    placeholder="Customer Address"
                    className="w-full border-none p-0 text-xs focus:outline-none bg-transparent"
                    value={invoiceForm?.clientDetail?.billingAddress || ""}
                    onChange={(e) => handlerInvoiceClientValue(e, "billingAddress")}
                  />
                ) : (
                  invoiceForm?.clientDetail?.billingAddress || "Customer Address"
                )}
              </div>
              <div>
                <span className="font-bold">Ph:</span> {!isViewMode ? (
                  <input
                    autoComplete="nope"
                    placeholder="Phone"
                    className="border-none p-0 text-xs focus:outline-none bg-transparent ml-1"
                    value={invoiceForm?.clientDetail?.mobileNo || ""}
                    onChange={(e) => handlerInvoiceClientValue(e, "mobileNo")}
                  />
                ) : (
                  invoiceForm?.clientDetail?.mobileNo || "Phone"
                )}
              </div>
              <div>
                <span className="font-bold">Email:</span> {!isViewMode ? (
                  <input
                    autoComplete="nope"
                    placeholder="Email"
                    className="border-none p-0 text-xs focus:outline-none bg-transparent ml-1"
                    value={invoiceForm?.clientDetail?.email || ""}
                    onChange={(e) => handlerInvoiceClientValue(e, "email")}
                  />
                ) : (
                  invoiceForm?.clientDetail?.email || "Email"
                )}
              </div>
              <div>
                <span className="font-bold">GSTIN:</span> {!isViewMode ? (
                  <input
                    autoComplete="nope"
                    placeholder="Customer GST"
                    className="border-none p-0 text-xs focus:outline-none bg-transparent ml-1"
                    value={invoiceForm?.clientDetail?.gstNo || ""}
                    onChange={(e) => handlerInvoiceClientValue(e, "gstNo")}
                  />
                ) : (
                  invoiceForm?.clientDetail?.gstNo || "Customer GST"
                )}
              </div>
            </div>
          </div>

          {!isViewMode && (
            <div className="mt-2">
              <Button size="sm" outlined={1} onClick={openChooseClient}>
                <ClientPlusIcon style={IconStyle} className="w-4 h-4" /> Choose Existing Client
              </Button>
            </div>
          )}
        </div>

        {/* Products Table */}
        <div className="border-2 border-black mb-4">
          <div className="border-b border-black bg-gray-100 p-2">
            <div className="flex text-xs font-bold">
              <div className="w-8 text-center">S.No</div>
              <div className="flex-1 text-center">Description</div>
              <div className="w-16 text-center">HSN</div>
              <div className="w-16 text-center">Qty</div>
              <div className="w-20 text-center">Rate</div>
              <div className="w-20 text-center">Amount</div>
              {!isViewMode && <div className="w-12 text-center">Action</div>}
            </div>
          </div>

          {invoiceForm?.products?.map((product, index) => (
            <div key={index} className="border-b border-gray-300 p-2">
              <div className="flex text-xs items-center">
                <div className="w-8 text-center">{index + 1}</div>
                <div className="flex-1 px-2">
                  {!isViewMode ? (
                    product.productID ? (
                      <input
                        autoComplete="nope"
                        value={product.name}
                        placeholder="Product Name"
                        className="w-full border-none p-0 text-xs focus:outline-none bg-transparent"
                        onChange={(e) => handlerProductValue(e, "name", product.id)}
                      />
                    ) : (
                      <textarea
                        autoComplete="nope"
                        value={product.name}
                        placeholder="Product Description"
                        className="w-full border-none p-0 text-xs focus:outline-none bg-transparent resize-none"
                        rows={2}
                        onChange={(e) => handlerProductValue(e, "name", product.id)}
                      />
                    )
                  ) : (
                    <span className="whitespace-pre-wrap">{product.name || "Product Name"}</span>
                  )}
                </div>
                <div className="w-16 text-center">
                  {!isViewMode ? (
                    <input
                      autoComplete="nope"
                      value={product.hsnCode || ""}
                      placeholder="HSN"
                      className="w-full border-none p-0 text-xs text-center focus:outline-none bg-transparent"
                      onChange={(e) => handlerProductValue(e, "hsnCode", product.id)}
                    />
                  ) : (
                    product.hsnCode || "-"
                  )}
                </div>
                <div className="w-16 text-center">
                  {!isViewMode ? (
                    <input
                      autoComplete="nope"
                      value={product.quantity}
                      type="number"
                      placeholder="1"
                      className="w-full border-none p-0 text-xs text-center focus:outline-none bg-transparent"
                      onChange={(e) => handlerProductValue(e, "quantity", product.id)}
                    />
                  ) : (
                    product.quantity || 1
                  )}
                </div>
                <div className="w-20 text-center">
                  {!isViewMode ? (
                    <NumberFormat
                      value={product.amount}
                      thousandSeparator={true}
                      prefix="₹"
                      placeholder="₹0.00"
                      className="w-full border-none p-0 text-xs text-center focus:outline-none bg-transparent"
                      onValueChange={(values) => {
                        const { floatValue } = values;
                        const fakeEvent = { target: { value: floatValue || 0 } };
                        handlerProductValue(fakeEvent, "amount", product.id);
                      }}
                    />
                  ) : (
                    <span>{invoiceForm?.currencyUnit || '₹'}{(product.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  )}
                </div>
                <div className="w-20 text-center font-bold">
                  {invoiceForm?.currencyUnit || '₹'}{((product.quantity || 1) * (product.amount || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
                {!isViewMode && (
                  <div className="w-12 text-center">
                    <button
                      onClick={() => onDeleteProduct(product.id)}
                      className="text-red-500 hover:text-red-700 focus:outline-none"
                    >
                      <DeleteIcon className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Tool Section - All buttons in single line */}
        {!isViewMode && (
          <div className="flex gap-2 text-xs flex-wrap">
            <Button size="sm" onClick={addEmptyProduct}>
              <PlusCircleIcon style={IconStyle} className="w-3 h-3" /> Add Product
            </Button>
            <Button size="sm" onClick={openChooseProduct}>
              <InvoiceIcon style={IconStyle} className="w-3 h-3" /> Choose Product
            </Button>
            <Button size="sm" onClick={addCGSTSGST}>
              <TaxesIcon style={IconStyle} className="w-3 h-3" /> CGST + SGST
            </Button>
            <Button size="sm" onClick={addIGST}>
              <TaxesIcon style={IconStyle} className="w-3 h-3" /> IGST
            </Button>
            <Button size="sm" onClick={addEmptyTax}>
              <DollarIcon style={IconStyle} className="w-3 h-3" /> Extra Fee
            </Button>
          </div>
        )}

        {/* Individual Tax Items */}
        {!isViewMode && invoiceForm?.taxes?.map((tax, index) => (
          <div key={`${index}_${tax.id}`} className="border border-gray-300 p-2 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">{tax.title}:</span>
                <input
                  autoComplete="nope"
                  value={tax.value}
                  type="number"
                  placeholder="Value"
                  className="w-16 border border-gray-300 rounded px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                  onChange={(e) => handlerTaxesValue(e, "value", tax.id)}
                />
                <span className="text-xs font-medium">
                  {tax.type === "percentage" ? "%" : invoiceForm.currencyUnit}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs font-medium">
                    {invoiceForm?.currencyUnit || '₹'}{(tax.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <button
                  onClick={() => onDeleteTax(tax.id)}
                  className="text-red-500 hover:text-red-700 focus:outline-none"
                >
                  <DeleteIcon className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Totals Section */}
        <div className="mb-4">
          <div className="flex justify-end">
            <div className="w-1/3">
              <div className="text-right space-y-1">
                <div className="flex justify-between">
                  <span className="text-xs">Taxable Amount</span>
                  <span className="text-xs font-bold">{invoiceForm?.currencyUnit || '₹'}{(sumProductTotal(invoiceForm?.products || [])).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                {invoiceForm?.taxes?.map((tax, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-xs">{tax.title} {tax.type === "percentage" ? `${tax.value}%` : ""}</span>
                                          <span className="text-xs font-bold">{invoiceForm?.currencyUnit || '₹'}{(tax.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t-2 border-black pt-1">
                  <span className="text-sm font-bold">Total</span>
                                      <span className="text-sm font-bold">{invoiceForm?.currencyUnit || '₹'}{(invoiceForm?.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Amount in Words */}
        <div className="mb-4">
          <div className="text-xs">
            <strong>Total amount (in words):</strong> INR {numberToWords(invoiceForm?.totalAmount || 0)}
          </div>
          <div className="text-xs mt-1">
            <strong>Amount Payable:</strong> {invoiceForm?.currencyUnit || '₹'}{(invoiceForm?.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mb-4 space-y-4">
          {/* UPI ID Section */}
          <div>
            <div className="text-xs font-bold mb-1">UPI ID:</div>
            {!isViewMode ? (
              <input
                autoComplete="nope"
                placeholder="your-upi@paytm"
                className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={invoiceForm?.companyDetail?.upiId || ""}
                onChange={(e) => setInvoiceForm(prev => ({ ...prev, companyDetail: { ...prev.companyDetail, upiId: e.target.value } }))}
              />
            ) : (
              <div className="text-xs">{invoiceForm?.companyDetail?.upiId || "your-upi@paytm"}</div>
            )}
          </div>

          {/* Bank Details and Authorization Section - Side by side */}
          <div className="flex justify-between gap-4">
            {/* Complete Bank Details */}
            <div className="flex-1">
              <div className="text-xs font-bold mb-2">Bank Details:</div>
              <div className="text-xs space-y-1">
                <div>
                  <span className="font-bold">Bank Name:</span> {invoiceForm?.companyDetail?.bankName || "Bank Name"}
                </div>
                <div>
                  <span className="font-bold">A/c No:</span> {invoiceForm?.companyDetail?.accountNumber || "Account Number"}
                </div>
                <div>
                  <span className="font-bold">IFSC:</span> {invoiceForm?.companyDetail?.ifscCode || "IFSC Code"}
                </div>
                <div>
                  <span className="font-bold">Branch:</span> {invoiceForm?.companyDetail?.branch || "Branch Name"}
                </div>
                <div>
                  <span className="font-bold">A/c Type:</span> {invoiceForm?.companyDetail?.accountType || "Current Account"}
                </div>
              </div>
            </div>

            {/* Authorization Section */}
            <div className="flex-1">
              <div className="text-right">
                <div className="text-xs font-bold mb-2">For {invoiceForm?.companyDetail?.companyName || "Company"}</div>
                <div className="flex flex-col items-end">
                  {invoiceForm?.companyDetail?.sealImage && (
                    <img
                      className="object-contain h-16 w-16 mb-2"
                      alt="Company Seal"
                      src={invoiceForm.companyDetail.sealImage}
                    />
                  )}
                  <div className="text-xs">Authorized Signatory</div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section - Centered */}
          <div className="text-center">
            <div className="text-xs font-bold mb-1">Notes:</div>
            <div className="text-xs">
              {!isViewMode ? (
                <textarea
                  autoComplete="nope"
                  placeholder="Thank you for the Business"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none text-center"
                  rows={2}
                  value={invoiceForm?.clientNote || ""}
                  onChange={(e) => handlerInvoiceValue(e, "clientNote")}
                />
              ) : (
                invoiceForm?.clientNote || "Thank you for the Business"
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default FormalTemplate; 