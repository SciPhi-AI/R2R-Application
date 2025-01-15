import { ChevronDown, ChevronUp } from 'lucide-react';
import React, { useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Entity, Community, Triple } from '@/types';

interface KGDescriptionDialogProps {
  open: boolean;
  onClose: () => void;
  item: Entity | Community | Triple | null;
  type: 'entity' | 'community' | 'triple';
}

const InfoRow: React.FC<{
  label: string;
  value?: any;
  values?: { label?: string; value: any }[];
}> = ({ label, value, values }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-700/50">
    <span className="font-medium text-gray-200">{label}:</span>
    <span className="text-gray-300 flex items-center space-x-4">
      {value !== undefined
        ? typeof value === 'object'
          ? JSON.stringify(value)
          : String(value) || 'N/A'
        : values
          ? values.map((item, index) => (
              <span key={index} className="flex items-center">
                {item.label && (
                  <span className="mr-1 text-gray-400">{item.label}:</span>
                )}
                <span>{String(item.value) || 'N/A'}</span>
              </span>
            ))
          : 'N/A'}
    </span>
  </div>
);

const ExpandableInfoRow: React.FC<{
  label: string;
  values?: any[];
}> = ({ label, values }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="py-2 border-b border-gray-700">
      <div className="flex items-center justify-between">
        <span className="font-medium">{label}:</span>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-300 flex items-center space-x-2"
        >
          <span>{values?.length ?? 0} items</span>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      {isExpanded && values && values.length > 0 && (
        <div className="mt-2 pl-4 text-gray-300">
          {values.map((value, index) => (
            <div key={index}>{String(value)}</div>
          ))}
        </div>
      )}
    </div>
  );
};

const AttributesSection: React.FC<{
  attributes: Record<string, any> | null | undefined;
}> = ({ attributes }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!attributes || Object.keys(attributes).length === 0) {
    return (
      <div className="py-2 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <span className="font-medium">Attributes:</span>
          <span className="text-gray-300">None</span>
        </div>
      </div>
    );
  }

  return (
    <div className="py-2 border-b border-gray-700">
      <div className="flex items-center justify-between">
        <span className="font-medium">Attributes:</span>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-300 flex items-center space-x-2"
        >
          <span>{Object.keys(attributes).length} fields</span>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      {isExpanded && (
        <div className="mt-2">
          <pre className="bg-zinc-900 p-3 rounded-md text-sm overflow-x-auto">
            {JSON.stringify(attributes, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

const KGDescriptionDialog: React.FC<KGDescriptionDialogProps> = ({
  open,
  onClose,
  item,
  type,
}) => {
  if (!item) {
    return null;
  }

  const renderEntityContent = (entity: Entity) => (
    <div className="space-y-2">
      <InfoRow label="Name" value={entity.name} />
      <InfoRow label="Category" value={entity.category} />
      <InfoRow label="Description" value={entity.description} />
      <ExpandableInfoRow
        label="Community Numbers"
        values={entity.community_numbers}
      />
      <ExpandableInfoRow label="Chunk IDs" values={entity.extraction_ids} />
      <InfoRow label="Document ID" value={entity.documentId} />
      <ExpandableInfoRow label="Document IDs" values={entity.documentIds} />
      <AttributesSection attributes={entity.attributes} />
    </div>
  );

  const renderCommunityContent = (community: Community) => (
    <div className="space-y-2">
      <InfoRow label="Community Number" value={community.community_number} />
      <InfoRow label="Collection ID" value={community.collection_id} />
      <InfoRow label="Level" value={community.level} />
      <InfoRow label="Name" value={community.name} />
      <div className="py-2 border-b border-gray-700">
        <div className="font-medium mb-2">Summary:</div>
        <p className="text-gray-300 whitespace-pre-wrap">{community.summary}</p>
      </div>
      <ExpandableInfoRow label="Findings" values={community.findings} />
      <InfoRow label="Rating" value={community.rating} />
      <div className="py-2 border-b border-gray-700">
        <div className="font-medium mb-2">Rating Explanation:</div>
        <p className="text-gray-300 whitespace-pre-wrap">
          {community.rating_explanation}
        </p>
      </div>
      <AttributesSection attributes={community.attributes} />
    </div>
  );

  const renderTripleContent = (triple: Triple) => (
    <div className="space-y-2">
      <InfoRow label="Subject" value={triple.subject} />
      <InfoRow label="Predicate" value={triple.predicate} />
      <InfoRow label="Object" value={triple.object} />
      <InfoRow label="Weight" value={triple.weight} />
      <InfoRow label="Description" value={triple.description} />
      <ExpandableInfoRow label="Chunk IDs" values={triple.extraction_ids} />
      <ExpandableInfoRow label="Document IDs" values={triple.documentIds} />
      <AttributesSection attributes={triple.attributes} />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="text-white max-w-4xl">
        <div className="mt-4 space-y-2 h-[calc(90vh-120px)] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-300 -mr-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold mb-2">
              {type.charAt(0).toUpperCase() + type.slice(1)} Details
            </DialogTitle>
          </DialogHeader>

          {type === 'entity' && renderEntityContent(item as Entity)}
          {type === 'community' && renderCommunityContent(item as Community)}
          {type === 'triple' && renderTripleContent(item as Triple)}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KGDescriptionDialog;
