import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ExternalLink,
  User,
  Calendar,
  Eye,
  AlertTriangle,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Agent } from "../../types";
import { AGENT_CATEGORIES } from "../../utils/constants";
import Button from "../common/Button";

interface AgentModalProps {
  agent: Agent;
  isOpen: boolean;
  onClose: () => void;
}

const AgentModal: React.FC<AgentModalProps> = ({ agent, isOpen, onClose }) => {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  const categoryInfo = AGENT_CATEGORIES.find(
    (cat) => cat.value === agent.category
  );

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleIframeLoad = () => {
    setIframeLoaded(true);
    setIframeError(false);
  };

  const handleIframeError = () => {
    setIframeError(true);
    setIframeLoaded(true);
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9999] bg-black bg-opacity-80"
        onClick={onClose}
      />

      {/* Centered Modal Card */}
      <div className="fixed inset-0 z-[10000] pointer-events-none flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-[95vw] h-[90vh] flex flex-col pointer-events-auto overflow-hidden border border-gray-700">
            {/* Simple Header - Just Agent Name */}
            <div className="px-6 py-4 border-b border-gray-700 flex-shrink-0 bg-gray-900 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                {agent.name}
              </h2>
              <Button
                onClick={onClose}
                variant="primary"
                className="bg-red-600 hover:bg-red-700"
                size="sm"
              >
                <X className="w-4 h-4 mr-2" />
                Close
              </Button>
            </div>

            {/* Content Area - Takes remaining space */}
            <div className="flex-1 relative bg-white min-h-0">
              {/* Loading State */}
              {!iframeLoaded && !iframeError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto mb-6"></div>
                    <p className="text-gray-600 text-lg">Loading agent...</p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {iframeError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div className="text-center max-w-lg mx-auto px-8">
                    <AlertTriangle className="w-20 h-20 text-red-500 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">
                      Failed to Load Agent
                    </h3>
                    <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                      This agent couldn't be loaded in the embedded view. This
                      might be due to security restrictions or the agent's
                      configuration.
                    </p>
                    <div className="flex gap-4 justify-center">
                      <Button
                        onClick={() => window.open(agent.app_url, "_blank")}
                        variant="primary"
                        className="bg-orange-600 hover:bg-orange-700 px-6 py-3 text-lg"
                      >
                        <ExternalLink className="w-5 h-5 mr-2" />
                        Open in New Tab
                      </Button>
                      <Button
                        onClick={onClose}
                        variant="ghost"
                        className="px-6 py-3 text-lg"
                      >
                        <X className="w-5 h-5 mr-2" />
                        Close
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Iframe */}
              <iframe
                src={agent.app_url}
                className={`w-full h-full border-0 ${
                  iframeLoaded ? "block" : "hidden"
                }`}
                title={agent.name}
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                allow="accelerometer; autoplay; camera; clipboard-write; encrypted-media; fullscreen; geolocation; gyroscope; microphone; midi; payment; usb; web-share"
              />
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-gray-700 bg-gray-900 flex justify-end flex-shrink-0">
              <Button
                onClick={() => window.open(agent.app_url, "_blank")}
                variant="primary"
                className="bg-orange-600 hover:bg-orange-700"
                size="sm"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in New Tab
              </Button>
            </div>
          </div>
        </div>
    </>,
    document.body
  );
};

export default AgentModal;
