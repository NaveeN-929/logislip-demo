import React from "react";
import Button from "../../Button/Button";
import DatePicker from "react-datepicker";
import NumberFormat from "react-number-format";
import { numberToWords } from "../../../utils/numberToWords";
import { defaultInputSmStyle } from "../../../constants/defaultStyles";
import ClientPlusIcon from "../../Icons/ClientPlusIcon";
import PlusCircleIcon from "../../Icons/PlusCircleIcon";
import InvoiceIcon from "../../Icons/InvoiceIcon";
import DeleteIcon from "../../Icons/DeleteIcon";
import TaxesIcon from "../../Icons/TaxesIcon";
import DollarIcon from "../../Icons/DollarIcon";

const IconStyle = { top: -2, position: "relative", marginRight: 2 };

function DefaultTemplate({
  invoiceForm,
  isViewMode,
  isExporting,
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
    <div
      className={
        isExporting
          ? "bg-white mb-1 pt-1 px-1 default-template-wrapper"
          : "bg-white mx-4 rounded-xl mb-1 default-template-wrapper"
      }
      id="InvoiceWrapper"
      style={isExporting ? { width: 1200 } : {}}
    >
      {/* Legacy Header Section */}
      <div
        className={
          isExporting
            ? "py-5 px-8 bg-cover bg-center bg-slate-50 rounded-xl flex flex-row justify-between items-center"
            : "py-9 px-8 bg-cover bg-center bg-slate-50 rounded-xl flex flex-col sm:flex-row justify-between items-center"
        }
        style={{
          backgroundImage: `url(${invoiceForm?.backgroundImage?.base64})`,
        }}
      >
        <div
          className={
            isExporting
              ? "flex xflex-row items-center"
              : "flex flex-col sm:flex-row items-center"
          }
        >
          {invoiceForm?.companyDetail?.image ? (
            <img
              className="object-contain h-20 w-20 mr-3 rounded"
              alt={invoiceForm?.companyDetail?.companyName}
              src={invoiceForm?.companyDetail?.image}
            />
          ) : (
            <span></span>
          )}

          <div
            className={
              isExporting
                ? "text-black font-title text-left"
                : "text-black font-title text-center sm:text-left"
            }
          >
            <p className="font-bold mb-2">
              {invoiceForm?.companyDetail?.companyName || "Company Name"}
            </p>
            <p className="text-sm font-medium">
              {invoiceForm?.companyDetail?.billingAddress ||
                "Plz add First Company Data"}
            </p>
            <p className="text-sm font-medium">
              {invoiceForm?.companyDetail?.companyMobile || "Company Ph"}
            </p>
            <p className="text-sm font-medium">
              {invoiceForm?.companyDetail?.companyEmail ||
                "Company@email.com"}
            </p>
            <p className="text-sm font-medium">
              GSTIN : {invoiceForm?.companyDetail?.companyGST ||
                "Company GST Number"}
            </p>
            <p className="text-sm font-medium">
              UDYAM : {invoiceForm?.companyDetail?.companyUDYAM ||
                "Company UDYAM Number"}
            </p>
            <p className="text-sm font-medium">
              SAC : {invoiceForm?.companyDetail?.companySAC ||
                "Company SAC Number"}
            </p>
          </div>
        </div>
        <div className="text-black font-title font-bold text-5xl mt-5 sm:mt-0">
          Invoice
        </div>
      </div>

      {/* Legacy Billing Section */}
      <div
        className={
          isExporting
            ? "flex flex-row pt-2 px-8"
            : "flex flex-col sm:flex-row pt-3 px-8"
        }
      >
        <div className="flex-1">
          <div className="flex flex-row">
            <div className="font-title font-bold">Billing To</div>
            <div className="w-1/2 relative ml-3" style={{ top: "-3px" }}>
              {!isViewMode && (
                <Button size="sm" outlined={1} onClick={openChooseClient}>
                  <ClientPlusIcon className="w-4 h-4" /> Exisiting
                </Button>
              )}
            </div>
          </div>
          <div className="client-form-wrapper sm:w-1/2">
            <div
              className={
                "font-medium " + (isExporting ? "text-xs" : "text-sm mb-1")
              }
            >
              {!isViewMode ? (
                <input
                  autoComplete="nope"
                  placeholder="Client Name"
                  className={defaultInputSmStyle}
                  value={invoiceForm?.clientDetail?.name}
                  onChange={(e) => handlerInvoiceClientValue(e, "name")}
                />
              ) : (
                invoiceForm?.clientDetail?.name
              )}
            </div>
            <div
              className={
                "font-medium " + (isExporting ? "text-xs" : "text-sm mb-1")
              }
            >
              {!isViewMode ? (
                <input
                  autoComplete="nope"
                  placeholder="Client Address"
                  className={defaultInputSmStyle}
                  value={invoiceForm?.clientDetail?.billingAddress}
                  onChange={(e) =>
                    handlerInvoiceClientValue(e, "billingAddress")
                  }
                />
              ) : (
                invoiceForm?.clientDetail?.billingAddress
              )}
            </div>
            <div
              className={
                "font-medium " + (isExporting ? "text-xs" : "text-sm mb-1")
              }
            >
              {!isViewMode ? (
                <input
                  autoComplete="nope"
                  placeholder="Client Mobile"
                  className={defaultInputSmStyle}
                  value={invoiceForm?.clientDetail?.mobileNo}
                  onChange={(e) => handlerInvoiceClientValue(e, "mobileNo")}
                />
              ) : (
                invoiceForm?.clientDetail?.mobileNo
              )}
            </div>
            <div
              className={
                "font-medium " + (isExporting ? "text-xs" : "text-sm mb-1")
              }
            >
              {!isViewMode ? (
                <input
                  autoComplete="nope"
                  placeholder="Client Email"
                  className={defaultInputSmStyle}
                  value={invoiceForm?.clientDetail?.email}
                  onChange={(e) => handlerInvoiceClientValue(e, "email")}
                />
              ) : (
                invoiceForm?.clientDetail?.email
              )}
            </div>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex flex-row justify-between items-center mb-1">
            <div className="font-title flex-1"> INVOICE # </div>
            <div className="font-title flex-1 text-right">
              {!isViewMode ? (
                <input
                  autoComplete="nope"
                  placeholder="Invoice No"
                  className={defaultInputSmStyle + " text-right"}
                  value={invoiceForm.invoiceNo}
                  onChange={(e) => handlerInvoiceValue(e, "invoiceNo")}
                />
              ) : (
                invoiceForm.invoiceNo || "-"
              )}
            </div>
          </div>
          <div className="flex flex-row justify-between items-center mb-1">
            <div className="font-title flex-1"> Creation Date </div>
            <div className="font-title flex-1 text-right">
              <DatePicker
                selected={invoiceForm.createdDate}
                onChange={(date) =>
                  handlerInvoiceValue(date.toISOString(), "createdDate")
                }
                disabled={isViewMode}
                className={
                  !isViewMode
                    ? defaultInputSmStyle + " border-gray-300 text-right"
                    : " text-right bg-white"
                }
              />
            </div>
          </div>
          <div className="flex flex-row justify-between items-center mb-1">
            <div className="font-title flex-1"> Due Date </div>
            <div className="font-title flex-1 text-right">
              <DatePicker
                selected={invoiceForm.dueDate}
                onChange={(date) =>
                  handlerInvoiceValue(date.toISOString(), "dueDate")
                }
                disabled={isViewMode}
                className={
                  !isViewMode
                    ? defaultInputSmStyle + " border-gray-300 text-right"
                    : " text-right bg-white"
                }
              />
            </div>
          </div>
          {!isViewMode && (
            <div className="flex flex-row justify-between items-center mb-1">
              <div className="font-title flex-1"> Change Currency </div>
              <div className="font-title flex-1 text-right">
                <input
                  autoComplete="nope"
                  placeholder="₹"
                  className={defaultInputSmStyle + " text-right"}
                  value={invoiceForm.currencyUnit}
                  onChange={(e) => handlerInvoiceValue(e, "currencyUnit")}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legacy Products Header */}
      <div className="py-2 px-4">
        <div
          className={
            isExporting
              ? "flex rounded-lg w-full flex-row px-4 py-1 text-white"
              : "hidden sm:flex rounded-lg invisible sm:visible w-full flex-col sm:flex-row px-4 py-2 text-white"
          }
          style={{ backgroundColor: invoiceForm.color }}
        >
          <div
            className={
              "font-title " +
              (isExporting
                ? " text-sm w-1/4 text-right pr-10"
                : " w-full sm:w-1/4 text-right sm:pr-10")
            }
          >
            <span className="inline-block">Description</span>
          </div>
          <div
            className={
              "font-title " +
              (isExporting
                ? " text-sm  w-1/4 text-right pr-10"
                : " w-full sm:w-1/4 text-right sm:pr-10")
            }
          >
            Price
          </div>
          <div
            className={
              "font-title " +
              (isExporting
                ? " text-sm  w-1/4 text-right pr-10"
                : " w-full sm:w-1/4 text-right sm:pr-10")
            }
          >
            Qty
          </div>
          <div
            className={
              "font-title" +
              (isExporting
                ? " text-sm w-1/4 text-right pr-10"
                : "  w-full sm:w-1/4 text-right sm:pr-10")
            }
          >
            Total
          </div>
        </div>

        {/* Legacy Products List */}
        {invoiceForm?.products?.map((product, index) => (
          <div
            key={`${index}_${product.id}`}
            className={
              (isExporting
                ? "flex flex-row rounded-lg w-full px-4 py-1 items-center relative text-sm"
                : "flex flex-col sm:flex-row rounded-lg sm:visible w-full px-4 py-2 items-center relative") +
              (index % 2 !== 0 ? " bg-gray-50 " : "")
            }
          >
            <div
              className={
                isExporting
                  ? "font-title w-1/4 text-right pr-8 flex flex-row block"
                  : "font-title w-full sm:w-1/4 text-right sm:pr-8 flex flex-row sm:block"
              }
            >
              {!isExporting && (
                <span className="sm:hidden w-1/2 flex flex-row items-center">
                  Description
                </span>
              )}
              <span
                className={
                  isExporting
                    ? "inline-block w-full mb-0"
                    : "inline-block w-1/2 sm:w-full mb-1 sm:mb-0"
                }
              >
                {!isViewMode ? (
                  // Use textarea for empty products (custom descriptions), input for existing products
                  product.productID ? (
                  <input
                    autoComplete="nope"
                    value={product.name}
                    placeholder="Product Name"
                    className={defaultInputSmStyle + " text-right"}
                    onChange={(e) =>
                      handlerProductValue(e, "name", product.id)
                    }
                  />
                ) : (
                    <textarea
                      autoComplete="nope"
                      value={product.name}
                      placeholder="Product Description (You can add detailed description here)"
                      className={defaultInputSmStyle + " text-right resize-none h-20 py-2"}
                      rows={3}
                      onChange={(e) =>
                        handlerProductValue(e, "name", product.id)
                      }
                    />
                  )
                ) : (
                  <span className="pr-3 whitespace-pre-wrap">{product.name}</span>
                )}
              </span>
            </div>
            <div
              className={
                isExporting
                  ? "font-title w-1/4 text-right pr-8 flex flex-row block"
                  : "font-title w-full sm:w-1/4 text-right sm:pr-8 flex flex-row sm:block"
              }
            >
              {!isExporting && (
                <span className="sm:hidden w-1/2 flex flex-row items-center">
                  Price
                </span>
              )}
              <span
                className={
                  isExporting
                    ? "inline-block w-full mb-0"
                    : "inline-block w-1/2 sm:w-full mb-1 sm:mb-0"
                }
              >
                {!isViewMode ? (
                  <input
                    autoComplete="nope"
                    value={product.amount}
                    placeholder="Price"
                    type={"number"}
                    className={defaultInputSmStyle + " text-right"}
                    onChange={(e) =>
                      handlerProductValue(e, "amount", product.id)
                    }
                  />
                ) : (
                  <span className="pr-3">
                    <NumberFormat
                      value={product.amount}
                      className=""
                      displayType={"text"}
                      thousandSeparator={true}
                      renderText={(value, props) => (
                        <span {...props}>{value}</span>
                      )}
                    />
                  </span>
                )}
              </span>
            </div>
            <div
              className={
                isExporting
                  ? "font-title w-1/4 text-right pr-8 flex flex-row block"
                  : "font-title w-full sm:w-1/4 text-right sm:pr-8 flex flex-row sm:block"
              }
            >
              {!isExporting && (
                <span className="sm:hidden w-1/2 flex flex-row items-center">
                  Quantity
                </span>
              )}
              <span
                className={
                  isExporting
                    ? "inline-block w-full mb-0"
                    : "inline-block w-1/2 sm:w-full mb-1 sm:mb-0"
                }
              >
                {!isViewMode ? (
                  <input
                    autoComplete="nope"
                    value={product.quantity}
                    type={"number"}
                    placeholder="Quantity"
                    className={defaultInputSmStyle + " text-right"}
                    onChange={(e) =>
                      handlerProductValue(e, "quantity", product.id)
                    }
                  />
                ) : (
                  <span className="pr-3">
                    <NumberFormat
                      value={product.quantity}
                      className=""
                      displayType={"text"}
                      thousandSeparator={true}
                      renderText={(value, props) => (
                        <span {...props}>{value}</span>
                      )}
                    />
                  </span>
                )}
              </span>
            </div>
            <div
              className={
                isExporting
                  ? "font-title w-1/4 text-right pr-9 flex flex-row block"
                  : "font-title w-full sm:w-1/4 text-right sm:pr-9 flex flex-row sm:block"
              }
            >
              {!isExporting && (
                <span className="sm:hidden w-1/2 flex flex-row items-center">
                  Total
                </span>
              )}

              <span
                className={
                  isExporting
                    ? "inline-block w-full "
                    : "inline-block w-1/2 sm:w-full"
                }
              >
                <NumberFormat
                  value={
                    Number.isInteger(product.quantity * product.amount)
                      ? product.quantity * product.amount
                      : (product.quantity * product.amount)
                          .toFixed(4)
                          .toString()
                          .slice(0, -2)
                  }
                  className=""
                  displayType={"text"}
                  thousandSeparator={true}
                  renderText={(value, props) => (
                    <span {...props}>{value}</span>
                  )}
                />{" "}
                {invoiceForm?.currencyUnit}
              </span>
            </div>
            {!isViewMode && (
              <div
                className="w-full sm:w-10 sm:absolute sm:right-0"
                onClick={() => onDeleteProduct(product.id)}
              >
                <div className="w-full text-red-500 font-title h-8 sm:h-8 sm:w-8 cursor-pointer rounded-2xl bg-red-200 mr-2 flex justify-center items-center">
                  <DeleteIcon className="h-4 w-4" />
                  <span className="block sm:hidden">Delete Product</span>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add Product Actions */}
        {!isViewMode && (
          <div className="flex flex-col sm:flex-row rounded-lg sm:visible w-full px-4 py-2 items-center sm:justify-end">
            <div className="font-title w-full sm:w-1/4 text-right sm:pr-8 flex flex-row sm:block mb-1">
              <Button size="sm" block={1} onClick={addEmptyProduct}>
                <PlusCircleIcon style={IconStyle} className="h-5 w-5" />
                Add Empty Product
              </Button>
            </div>
            <div className="font-title w-full sm:w-1/4 text-right sm:pr-8 flex flex-row sm:block mb-1">
              <Button size="sm" block={1} onClick={openChooseProduct}>
                <InvoiceIcon style={IconStyle} className="w-5 h-5" />
                Add Exisiting Product
              </Button>
            </div>
          </div>
        )}
        {/* Add Product Actions Finished*/}

        {/* Subtotal Start */}
        <div
          className={
            isExporting
              ? "flex flex-row rounded-lg w-full px-4 py-1 justify-end items-end relative text-sm"
              : "flex flex-row sm:flex-row sm:justify-end rounded-lg sm:visible w-full px-4 py-1 items-center "
          }
        >
          <div
            className={
              isExporting
                ? "font-title w-1/4 text-right pr-9 flex flex-row block justify-end text-sm "
                : "font-title w-1/2 sm:w-1/4 text-right sm:pr-8 flex flex-row sm:block mb-1 sm:mb-0"
            }
          >
            Subtotal
          </div>
          <div
            className={
              isExporting
                ? "font-title w-1/4 text-right pr-9 flex flex-row block justify-end text-sm "
                : "font-title w-1/2 sm:w-1/4 text-right sm:pr-9 flex flex-row justify-end sm:block mb-1"
            }
          >
            <NumberFormat
              value={sumProductTotal(invoiceForm?.products || [])}
              className="inline-block"
              displayType={"text"}
              thousandSeparator={true}
              renderText={(value, props) => (
                <span {...props}>
                  {value} {invoiceForm?.currencyUnit}
                </span>
              )}
            />
          </div>
        </div>
        {/* Subtotal Finished */}

        {/* Taxes */}
        {invoiceForm?.taxes?.map((tax, index) => {
          const totalPercentTax = ((tax.value / 100) * sumProductTotal(invoiceForm?.products || []));

          return (
            <div
              key={`${index}_${tax.id}`}
              className={
                isExporting
                  ? "flex flex-row justify-end rounded-lg w-full px-4 py-1 items-center relative"
                  : "flex flex-col sm:flex-row sm:justify-end rounded-lg sm:visible w-full px-4 py-1 items-center relative"
              }
            >
              <div
                className={
                  isExporting
                    ? "font-title w-3/5 text-right pr-8 flex flex-row block"
                    : "font-title w-full sm:w-3/5 text-right sm:pr-8 flex flex-row sm:block"
                }
              >
                {!isExporting && (
                  <div className="sm:hidden w-1/3 flex flex-row items-center">
                    Tax Type
                  </div>
                )}
                <div
                  className={
                    isExporting
                      ? "w-full mb-0 flex flex-row items-center justify-end"
                      : "w-2/3 sm:w-full mb-1 sm:mb-0 flex flex-row items-center sm:justify-end"
                  }
                >
                  <div
                    className={
                      isExporting ? "w-1/3 pr-1" : "w-1/2 sm:w-1/3 pr-1"
                    }
                  >
                    {!isViewMode && (
                      <input
                        autoComplete="nope"
                        value={tax.title}
                        type={"text"}
                        placeholder="Tax Title"
                        className={defaultInputSmStyle + " text-right"}
                        onChange={(e) =>
                          handlerTaxesValue(e, "title", tax.id)
                        }
                      />
                    )}
                  </div>
                  <div
                    className={
                      (isExporting
                        ? "w-1/3 relative flex flex-row items-center text-sm"
                        : "w-1/2 sm:w-1/3 relative flex flex-row items-center") +
                      (isViewMode ? " justify-end" : " pr-4")
                    }
                  >
                    {!isViewMode ? (
                      <>
                        <input
                          autoComplete="nope"
                          value={tax.value}
                          type={"number"}
                          placeholder="Percentage"
                          className={defaultInputSmStyle + " text-right"}
                          onChange={(e) =>
                            handlerTaxesValue(e, "value", tax.id)
                          }
                        />
                        <span className="ml-1">
                          {tax.type === "percentage"
                            ? "%"
                            : invoiceForm.currencyUnit}
                        </span>
                      </>
                    ) : (
                      <div className="text-right">{tax.title}</div>
                    )}
                  </div>
                </div>
              </div>
              <div
                className={
                  isExporting
                    ? "font-title w-1/4 text-right pr-9 flex flex-row text-sm"
                    : "font-title w-full sm:w-1/4 text-right sm:pr-9 flex flex-row sm:block"
                }
              >
                {!isExporting && (
                  <span className="sm:hidden w-1/2 flex flex-row items-center">
                    Amount
                  </span>
                )}
                <span
                  className={
                    isExporting
                      ? "inline-block w-full"
                      : "inline-block w-1/2 sm:w-full"
                  }
                >
                  <>
                    <div className="w-full">
                      <NumberFormat
                        value={
                          tax.type === "percentage"
                            ? totalPercentTax
                            : tax.amount
                        }
                        className=""
                        displayType={"text"}
                        thousandSeparator={true}
                        renderText={(value, props) => (
                          <span {...props}>
                            {value} {invoiceForm?.currencyUnit}
                          </span>
                        )}
                      />
                    </div>
                  </>
                </span>
              </div>
              {!isViewMode && (
                <div
                  className="w-full sm:w-10 sm:absolute sm:right-0"
                  onClick={() => onDeleteTax(tax.id)}
                >
                  <div className="w-full text-red-500 font-title h-8 sm:h-8 sm:w-8 cursor-pointer rounded-2xl bg-red-200 mr-2 flex justify-center items-center">
                    <DeleteIcon className="h-4 w-4" />
                    <span className="block sm:hidden">Delete Tax</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {/* Taxes Finished*/}

        {/* Add Tax Action */}
        {!isViewMode && (
          <div className="flex flex-col sm:flex-row rounded-lg sm:visible w-full px-4 py-2 items-center sm:justify-end">
            <div className="font-title w-full sm:w-1/4 text-right sm:pr-8 flex flex-row sm:block mb-1">
              <Button size="sm" block={1} onClick={addCGSTSGST}>
                <TaxesIcon style={IconStyle} className="h-5 w-5" />
                CGST + SGST (2.5% each)
              </Button>
            </div>
            <div className="font-title w-full sm:w-1/4 text-right sm:pr-8 flex flex-row sm:block mb-1">
              <Button size="sm" block={1} onClick={addIGST}>
                <TaxesIcon style={IconStyle} className="h-5 w-5" />
                IGST (Editable %)
              </Button>
            </div>
            <div className="font-title w-full sm:w-1/4 text-right sm:pr-8 flex flex-row sm:block mb-1">
              <Button size="sm" block={1} onClick={addEmptyTax}>
                <DollarIcon style={IconStyle} className="w-5 h-5" />
                Add Extra Fee
              </Button>
            </div>
          </div>
        )}
        {/* Add Tax Action Finished*/}
      </div>

      {/* Legacy Total Section */}
      <div
        className={
          isExporting
            ? "flex flex-row justify-end w-full items-center text-white"
            : "flex flex-row sm:flex-row sm:justify-end w-full items-center text-white"
        }
      >
        <div
          className={
            isExporting
              ? "w-1/2 px-4 py-1 flex flex-row rounded-lg items-center"
              : "w-full sm:w-1/2 px-4 py-1 flex flex-row rounded-lg items-center"
          }
          style={{ backgroundColor: invoiceForm.color }}
        >
          <div
            className={
              isExporting
                ? "font-title text-base w-1/2 text-right pr-9 flex flex-row block  justify-end items-center"
                : "font-title text-lg w-1/2 text-right sm:pr-9 flex flex-row sm:block items-center"
            }
          >
            Total
          </div>
          <div
            className={
              isExporting
                ? "font-title text-lg w-1/2 text-right pr-9 flex flex-row block  justify-end items-center"
                : "font-title text-lg w-1/2 text-right sm:pr-9 flex flex-row justify-end sm:block items-center"
            }
          >
            <NumberFormat
              value={invoiceForm?.totalAmount}
              className=""
              displayType={"text"}
              thousandSeparator={true}
              renderText={(value, props) => (
                <span {...props}>
                  {value}{" "}
                  <span className={isExporting ? "text-sm" : "text-base"}>
                    {invoiceForm?.currencyUnit}
                  </span>
                </span>
              )}
            />
          </div>
        </div>
      </div>

      {/* Amount in Words */}
      <div
        className={
          isExporting
            ? "flex flex-row justify-end w-full items-start mt-2"
            : "flex flex-row sm:flex-row sm:justify-end w-full items-start mt-2"
        }
      >
        <div
          className={
            isExporting
              ? "w-1/2 px-4 py-2 flex flex-col rounded-lg"
              : "w-full sm:w-1/2 px-4 py-2 flex flex-col rounded-lg"
          }
          style={{ backgroundColor: "#f8f9fa", border: "1px solid #e9ecef" }}
        >
          <div
            className={
              isExporting
                ? "font-title text-sm font-bold mb-1 text-gray-700"
                : "font-title text-base font-bold mb-1 text-gray-700"
            }
          >
            Amount in words: {numberToWords(invoiceForm?.totalAmount || 0)}
          </div>
        </div>
      </div>
      {/* Amount in Words Finished */}

      {/* Bank Details + Signature Section */}
      <div
        className={
          isExporting
            ? "flex flex-row w-full mt-4 gap-4"
            : "flex flex-col sm:flex-row w-full mt-4 gap-4"
        }
      >
        {/* Left Column - Bank Details */}
        <div
          className={
            isExporting
              ? "w-1/2 flex flex-col gap-4"
              : "w-full sm:w-1/2 flex flex-col gap-4"
          }
        >
          {/* Bank Details */}
          {(invoiceForm?.companyDetail?.bankName || 
            invoiceForm?.companyDetail?.accountName || 
            invoiceForm?.companyDetail?.accountNumber || 
            invoiceForm?.companyDetail?.branchName || 
            invoiceForm?.companyDetail?.ifscCode) && (
            <div className="px-4 py-3">
              <div
                className={
                  isExporting
                    ? "font-title text-sm font-bold mb-2 text-gray-700"
                    : "font-title text-base font-bold mb-2 text-gray-700"
                }
              >
                Bank Details:
              </div>
              <div
                className={
                  isExporting
                    ? "text-xs text-gray-600 leading-relaxed"
                    : "text-sm text-gray-600 leading-relaxed"
                }
              >
                {invoiceForm?.companyDetail?.accountName && (
                  <div>A/c Name : {invoiceForm.companyDetail.accountName}</div>
                )}
                {invoiceForm?.companyDetail?.accountNumber && (
                  <div>A/c Number: {invoiceForm.companyDetail.accountNumber}</div>
                )}
                {invoiceForm?.companyDetail?.bankName && (
                  <div>Bank Name: {invoiceForm.companyDetail.bankName}</div>
                )}
                {invoiceForm?.companyDetail?.branchName && (
                  <div>Branch: {invoiceForm.companyDetail.branchName}</div>
                )}
                {invoiceForm?.companyDetail?.ifscCode && (
                  <div>IFSC Code: {invoiceForm.companyDetail.ifscCode}</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Company Name and Authorized Signature */}
        <div
          className={
            isExporting
              ? "w-1/2 flex flex-col justify-end items-end"
              : "w-full sm:w-1/2 flex flex-col justify-end items-end"
          }
        >
          <div className="text-right px-4 py-3">
            <div
              className={
                isExporting
                  ? "font-title text-sm font-bold mb-4 text-gray-700"
                  : "font-title text-base font-bold mb-4 text-gray-700"
              }
            >
              For {invoiceForm?.companyDetail?.companyName || "COMPANY NAME"}
            </div>
            
            {/* Authorized Signature with Seal */}
            <div className="flex flex-col items-end">
              {invoiceForm?.companyDetail?.sealImage && (
                <img
                  className="object-contain h-16 w-16 mb-2 rounded"
                  alt="Company Seal"
                  src={invoiceForm.companyDetail.sealImage}
                />
              )}
              <div
                className={
                  isExporting
                    ? "text-xs text-gray-600 border-t border-gray-400 pt-1 mt-2"
                    : "text-sm text-gray-600 border-t border-gray-400 pt-1 mt-2"
                }
              >
                Authorized Signature
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Bank Details + Signature Section Finished */}
    </div>
  );
}

export default DefaultTemplate;