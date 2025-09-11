import React, { useState, useEffect } from 'react';
import { Send, Bot, AlertCircle, CheckCircle, ExternalLink, Eye } from 'lucide-react';
import Button from '../common/Button';
import ErrorMessage from '../common/ErrorMessage';
import { Category, AgentCreateRequest } from '../../types';
import { VALIDATION_RULES, AGENT_CATEGORIES } from '../../utils/constants';
import { validateUrl, validateEmail } from '../../utils/validation';

interface AgentFormProps {
  onSubmit: (data: AgentCreateRequest) => Promise<void>;
  initialData?: Partial<AgentCreateRequest>;
  categories: Category[];
  isEditing?: boolean;
  submitButtonText?: string;
  className?: string;
}

const AgentForm: React.FC<AgentFormProps> = ({
  onSubmit,
  initialData = {},
  categories,
  isEditing = false,
  submitButtonText = 'Submit Agent',
  className = ''
}) => {
  const [formData, setFormData] = useState<AgentCreateRequest>({
    name: initialData.name || '',
    description: initialData.description || '',
    app_url: initialData.app_url || '',
    category: initialData.category || '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    // Update form when initialData changes
    setFormData({
      name: initialData.name || '',
      description: initialData.description || '',
      app_url: initialData.app_url || '',
      category: initialData.category || '',
    });
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Agent name is required';
    } else if (formData.name.length < VALIDATION_RULES.agentName.minLength) {
      newErrors.name = VALIDATION_RULES.agentName.message;
    } else if (formData.name.length > VALIDATION_RULES.agentName.maxLength) {
      newErrors.name = VALIDATION_RULES.agentName.message;
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < VALIDATION_RULES.agentDescription.minLength) {
      newErrors.description = VALIDATION_RULES.agentDescription.message;
    } else if (formData.description.length > VALIDATION_RULES.agentDescription.maxLength) {
      newErrors.description = VALIDATION_RULES.agentDescription.message;
    }

    // URL validation
    if (!formData.app_url.trim()) {
      newErrors.app_url = 'Application URL is required';
    } else if (!validateUrl(formData.app_url)) {
      newErrors.app_url = VALIDATION_RULES.agentUrl.message;
    }

    // Category validation
    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      
      // Reset form if not editing
      if (!isEditing) {
        setFormData({
          name: '',
          description: '',
          app_url: '',
          category: '',
        });
      }
    } catch (error) {
      // Error handling is done by parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreview = () => {
    if (formData.app_url && validateUrl(formData.app_url)) {
      setPreviewUrl(formData.app_url);
      setShowPreview(true);
    }
  };

  const getCharacterCount = (text: string, max: number) => {
    const count = text.length;
    const isOverLimit = count > max;
    const percentage = (count / max) * 100;
    
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-700 rounded-full h-1">
          <div 
            className={`h-1 rounded-full transition-all duration-300 ${
              isOverLimit 
                ? 'bg-red-500' 
                : percentage > 80 
                ? 'bg-yellow-500' 
                : 'bg-orange-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <span className={`text-xs ${isOverLimit ? 'text-red-400' : 'text-gray-400'}`}>
          {count}/{max}
        </span>
      </div>
    );
  };

  const selectedCategory = AGENT_CATEGORIES.find(cat => cat.value === formData.category);

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Agent Name */}
        <div>
          <label className="block text-gray-300 mb-2 font-medium">
            Agent Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full p-4 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
              errors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-orange-500'
            }`}
            placeholder="Enter a descriptive name for your AI agent"
            maxLength={VALIDATION_RULES.agentName.maxLength}
          />
          <div className="mt-2">
            {errors.name && <p className="text-sm text-red-400 mb-2">{errors.name}</p>}
            {getCharacterCount(formData.name, VALIDATION_RULES.agentName.maxLength)}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-gray-300 mb-2 font-medium">
            Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className={`w-full p-4 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors resize-none ${
              errors.description ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-orange-500'
            }`}
            placeholder="Provide a detailed description of what your AI agent does, its capabilities, and how it can help users..."
            maxLength={VALIDATION_RULES.agentDescription.maxLength}
          />
          <div className="mt-2">
            {errors.description && <p className="text-sm text-red-400 mb-2">{errors.description}</p>}
            {getCharacterCount(formData.description, VALIDATION_RULES.agentDescription.maxLength)}
          </div>
        </div>

        {/* Application URL */}
        <div>
          <label className="block text-gray-300 mb-2 font-medium">
            Application URL *
          </label>
          <div className="relative">
            <input
              type="url"
              name="app_url"
              value={formData.app_url}
              onChange={handleChange}
              className={`w-full p-4 pr-24 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
                errors.app_url ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-orange-500'
              }`}
              placeholder="https://your-agent-app.com"
            />
            {formData.app_url && validateUrl(formData.app_url) && (
              <button
                type="button"
                onClick={handlePreview}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-orange-400 transition-colors"
                title="Preview URL"
              >
                <Eye className="w-5 h-5" />
              </button>
            )}
          </div>
          {errors.app_url && <p className="text-sm text-red-400 mt-2">{errors.app_url}</p>}
          <p className="text-xs text-gray-500 mt-2">
            Provide the URL where users can access and interact with your AI agent
          </p>
        </div>

        {/* Category */}
        <div>
          <label className="block text-gray-300 mb-2 font-medium">
            Category *
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={`w-full p-4 bg-gray-800 border rounded-lg text-white focus:outline-none transition-colors ${
              errors.category ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-orange-500'
            }`}
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label} ({category.count} agents)
              </option>
            ))}
          </select>
          {errors.category && <p className="text-sm text-red-400 mt-2">{errors.category}</p>}
          {selectedCategory && (
            <p className="text-xs text-gray-500 mt-2">
              Category: {selectedCategory.label} - Choose the category that best describes your AI agent's primary function
            </p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setFormData({ name: '', description: '', app_url: '', category: '' });
              setErrors({});
            }}
            disabled={isSubmitting}
          >
            Clear Form
          </Button>
          
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            className="flex-1"
          >
            <Send className="w-5 h-5 mr-2" />
            {isSubmitting ? 'Submitting...' : submitButtonText}
          </Button>
        </div>

        {/* Form Validation Summary */}
        {Object.keys(errors).length > 0 && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400 font-medium">Please fix the following errors:</span>
            </div>
            <ul className="list-disc list-inside text-sm text-red-300 space-y-1">
              {Object.values(errors).map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </form>

      {/* URL Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-orange-500/20 w-full max-w-4xl h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h3 className="text-white font-semibold">Preview: {formData.name}</h3>
              <div className="flex items-center gap-2">
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="flex-1">
              <iframe
                src={previewUrl}
                className="w-full h-full border-0"
                title={`Preview: ${formData.name}`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentForm;