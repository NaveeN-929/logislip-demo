import React from "react";
import { IconStyle } from "../../constants/defaultStyles";
import Button from "../Button/Button";
import EyeOpenIcon from "../Icons/EyeOpenIcon";
import PencilIcon from "../Icons/PencilIcon";
import SettingIcon from "../Icons/SettingIcon";
import useSubscriptionLimits from "../../hooks/useSubscriptionLimits";

function InvoiceTopBar({
  viewMode = false,
  onClickViewAs,
  onClickSetting,
  onClickExport,
  onClickGoogleDriveExport,
  onClickBack,
  isGoogleDriveUploading = false,
  googleAuthToken = null,
  selectedTemplate = 'default', // Add selectedTemplate prop
}) {
  const { canExportFormat, canUseFeature, canUseTemplate } = useSubscriptionLimits();
  
  const canExportPDF = canExportFormat('pdf');
  const canUseCurrentTemplate = canUseTemplate(selectedTemplate);
  const canExportWithCurrentTemplate = canExportPDF && canUseCurrentTemplate;
  const canExportToDrive = canUseFeature('export_drive');

  // Handler for disabled export buttons - redirect to subscription page
  const handleDisabledExportClick = () => {
    window.location.href = '/subscription';
  };

  return (
    <div className="bg-white rounded-xl px-3 py-3">
      <div className="flex flex-col flex-wrap sm:flex-row justify-between">
        <div className="w-full sm:w-1/2 lg:w-1/4 my-1 sm:my-1 md:my-0 px-1 flex flex-row">
          <div className="w-30 mr-3">
            <Button size="sm" block={1} onClick={onClickBack}>
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={"M15 19l-7-7 7-7"}
                  />
                </svg>
              </>
            </Button>
          </div>
          <div className="flex-1">
            <Button size="sm" block={1} outlined={1} onClick={onClickViewAs}>
              {!viewMode ? (
                <>
                  <EyeOpenIcon className="h-4 w-4" style={IconStyle} /> View
                  Mode
                </>
              ) : (
                <>
                  <PencilIcon className="h-4 w-4" style={IconStyle} /> Editing
                  Mode
                </>
              )}
            </Button>
          </div>
        </div>
        
        <div className="w-full sm:w-1/2 lg:w-1/4 my-1 sm:my-1 md:my-0 px-1">
          <Button size="sm" block={1} outlined={1} onClick={onClickSetting}>
            <SettingIcon className="h-4 w-4" /> Setting
          </Button>
        </div>
        <div className="w-full sm:w-1/2 lg:w-1/4 my-1 sm:my-1 md:my-0 px-1">
          <Button 
            size="sm" 
            block={1} 
            outlined={1} 
            onClick={canExportWithCurrentTemplate ? onClickExport : handleDisabledExportClick}
            disabled={!canExportWithCurrentTemplate}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              style={IconStyle}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                clipRule="evenodd"
              />
            </svg>
            {canExportWithCurrentTemplate ? 'Export PDF' : 
             !canExportPDF ? 'Upgrade to Export' :
             !canUseCurrentTemplate ? `Upgrade for ${selectedTemplate.charAt(0).toUpperCase() + selectedTemplate.slice(1)} Template` :
             'Upgrade to Export'}
          </Button>
        </div>
        <div className="w-full sm:w-1/2 lg:w-1/4 my-1 sm:my-1 md:my-0 px-1">
          <Button 
            size="sm" 
            block={1} 
            outlined={1} 
            onClick={
              (!googleAuthToken || isGoogleDriveUploading || !canExportToDrive) 
                ? handleDisabledExportClick 
                : onClickGoogleDriveExport
            }
            disabled={!googleAuthToken || isGoogleDriveUploading || !canExportToDrive}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              style={IconStyle}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
              />
            </svg>
            {isGoogleDriveUploading ? "Uploading..." : 
             !canExportToDrive ? "Upgrade for Drive Export" :
             !googleAuthToken ? "Sign in for Drive Export" :
             "Export to Drive"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default InvoiceTopBar;
