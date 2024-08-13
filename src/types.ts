import { r2rClient } from 'r2r-js';

export interface AdminBadgeProps {
  isAdmin: boolean;
  viewMode: 'admin' | 'user';
  onToggle: () => void;
}

export interface AnalyticsData {
  [key: string]: any;
  percentiles?: Record<string, number | string>;
  filtered_logs?: {
    [key: string]: any[];
  };
}

export interface AuthState {
  isAuthenticated: boolean;
  email: string | null;
  password: string | null;
  userRole: 'admin' | 'user' | null;
}

export interface BarChartProps {
  data: {
    filtered_logs?: {
      [key: string]: Array<{ value: string }>;
    };
  };
  selectedFilter: string;
}

export interface DefaultQueriesProps {
  setQuery: (query: string) => void;
  mode: 'rag' | 'rag_agent';
}

export interface DeleteButtonProps {
  selectedDocumentIds: string[];
  onDelete: () => void;
  onSuccess: () => void;
  showToast: (message: {
    title: string;
    description: string;
    variant: 'default' | 'destructive' | 'success';
  }) => void;
}

export interface Document {
  id: string;
  text: string;
  metadata: any;
}

export interface DocumentFilterCriteria {
  sort: 'title' | 'date';
  order: 'asc' | 'desc';
}

export interface DocumentInfoType {
  document_id: string;
  user_id: string;
  title: string;
  version: string;
  updated_at: string;
  size_in_bytes: number;
  metadata: any;
}

export interface DocumentInfoDialogProps {
  documentId: string;
  open: boolean;
  onClose: () => void;
}

export interface DocumentChunk {
  chunk_order: number;
  text: string;
}

export interface EditPromptDialogProps {
  open: boolean;
  onClose: () => void;
  promptName: string;
  promptTemplate: string;
  onSaveSuccess: () => void;
}

export interface GenerationConfig {
  // RAG Configuration
  temperature?: number;
  setTemperature?: (value: number) => void;
  top_p?: number;
  setTopP?: (value: number) => void;
  top_k?: number;
  setTop_k?: (value: number) => void;
  max_tokens_to_sample?: number;
  setMax_tokens_to_sample?: (value: number) => void;
  model?: string;
  setModel?: (value: string) => void;
  stream?: boolean;
  setStream?: (value: boolean) => void;
  functions?: Array<Record<string, any>> | null;
  setFunctions?: (value: Array<Record<string, any>> | null) => void;
  skip_special_tokens?: boolean;
  setSkipSpecialTokens?: (value: boolean) => void;
  stop_token?: string | null;
  setStopToken?: (value: string | null) => void;
  num_beams?: number;
  setNumBeams?: (value: number) => void;
  do_sample?: boolean;
  setDoSample?: (value: boolean) => void;
  generate_with_chat?: boolean;
  setGenerateWithChat?: (value: boolean) => void;
  add_generation_kwargs?: Record<string, any>;
  setAddGenerationKwargs?: (value: Record<string, any>) => void;
  api_base?: string | null;
  setApiBase?: (value: string | null) => void;

  // Knowledge Graph Configuration
  kg_temperature?: number;
  setKgTemperature?: (value: number) => void;
  kg_top_p?: number;
  setKgTopP?: (value: number) => void;
  kg_top_k?: number;
  setKgTop_k?: (value: number) => void;
  kg_max_tokens_to_sample?: number;
  setKgMax_tokens_to_sample?: (value: number) => void;
}

export interface HighlightProps {
  color: string;
  textColor: string;
  children: React.ReactNode;
}

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
  onClick?: () => void;
  disableLink?: boolean;
  priority?: boolean;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  id?: string;
  timestamp?: number;
  isStreaming?: boolean;
  sources?: string | null;
  searchPerformed?: boolean;
}

export interface ModelSelectorProps {
  id?: string;
}

export interface NavbarProps {
  className?: string;
}

export interface NavItemsProps {
  isAuthenticated: boolean;
  effectiveRole: 'admin' | 'user';
  pathname: string;
}

export interface Pipeline {
  deploymentUrl: string;
}

export interface PipelineStatusProps {
  className?: string;
  onStatusChange?: (isConnected: boolean) => void;
}

export interface R2RServerCardProps {
  pipeline: Pipeline | null;
  onStatusChange: (status: boolean) => void;
}

export interface RagGenerationConfig {
  temperature?: number;
  top_p?: number;
  top_k?: number;
  max_tokens_to_sample?: number;
  model?: string;
  stream: boolean;
  kg_temperature?: number;
  kg_top_p?: number;
  kg_top_k?: number;
  kg_max_tokens_to_sample?: number;
}

export interface SearchProps {
  pipeline?: Pipeline;
  setQuery: (query: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export interface ServerStats {
  start_time: string;
  uptime_seconds: number;
  cpu_usage: number;
  memory_usage: number;
}

export interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  switches: any;
  handleSwitchChange: (id: string, checked: boolean) => void;
  searchLimit: number;
  setSearchLimit: (limit: number) => void;
  searchFilters: string;
  setSearchFilters: (filters: string) => void;
  selectedModel: string;
  top_k: number;
  setTop_k: (value: number) => void;
  max_tokens_to_sample: number;
  setMax_tokens_to_sample: (value: number) => void;
  temperature: number;
  setTemperature: (value: number) => void;
  topP: number;
  setTopP: (value: number) => void;
  kg_temperature: number;
  setKgTemperature: (value: number) => void;
  kg_top_p: number;
  setKgTopP: (value: number) => void;
  kg_top_k: number;
  setKgTop_k: (value: number) => void;
  kg_max_tokens_to_sample: number;
  setKgMax_tokens_to_sample: (value: number) => void;
}

export interface SingleSwitchProps {
  id: string;
  initialChecked: boolean;
  onChange: (id: string, checked: boolean) => void;
  label: string;
  tooltipText: string;
}

export interface Switch {
  checked: boolean;
  label: string;
  tooltipText: string;
}

export interface Source {
  title: string;
  snippet: string;
  id: string;
  score: number;
  link: string;
  isFamilyFriendly: boolean;
  displayUrl: string;
  deepLinks: { snippet: string; name: string; url: string }[];
  dateLastCrawled: string;
  cachedPageUrl: string;
  language: string;
  primaryImageOfPage?: {
    thumbnailUrl: string;
    width: number;
    height: number;
    imageId: string;
  };
  isNavigational: boolean;
  metadata: any;
}

export interface SpinnerProps {
  className?: string;
}

export type TagColor = 'rose' | 'amber' | 'emerald' | 'zinc' | 'indigo' | 'sky';

export interface UpdateButtonContainerProps {
  documentId: string;
  onUpdateSuccess: () => void;
  showToast: (message: {
    title: string;
    description: string;
    variant: 'default' | 'destructive' | 'success';
  }) => void;
}

export interface UpdateButtonProps {
  userId: string;
  documentId: string;
  onUpdateSuccess: () => void;
  showToast?: (message: {
    title: string;
    description: string;
    variant: 'default' | 'destructive' | 'success';
  }) => void;
}

export interface UploadButtonProps {
  userId: string | null;
  uploadedDocuments: any[];
  onUploadSuccess?: () => void;
  setUploadedDocuments: (docs: any[]) => void;
  showToast?: (message: {
    title: string;
    description: string;
    variant: 'default' | 'destructive' | 'success';
  }) => void;
}
export interface UploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => void;
}

export interface UserContextProps {
  pipeline: Pipeline | null;
  setPipeline: (pipeline: Pipeline) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string,
    instanceUrl: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  authState: AuthState;
  getClient: () => r2rClient | null;
  client: r2rClient | null;
  viewMode: 'admin' | 'user';
  setViewMode: React.Dispatch<React.SetStateAction<'admin' | 'user'>>;
}
