import { r2rClient } from 'r2r-js';

export interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (item: T) => React.ReactNode;
}

export interface SortCriteria<T> {
  key: keyof T;
  order: 'asc' | 'desc';
}

export interface FilterCriteria<T> {
  [key: string]: any;
}

export interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  initialSort?: SortCriteria<T>;
  initialFilters?: FilterCriteria<T>;
  onRowSelect?: (selectedIds: string[]) => void;
  pagination?: {
    itemsPerPage: number;
    initialPage?: number;
  };
}

export interface AuthState {
  isAuthenticated: boolean;
  email: string | null;
  userRole: 'admin' | 'user' | null;
  userId: string | null;
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
  collectionIds?: string[];
}

export interface Entity {
  name: string;
  category: string;
  description: string;
  description_embedding: number[];
  community_numbers: number[];
  extraction_ids: string[];
  documentId: string;
  documentIds: string[];
  attributes: Record<string, any>;
}

export interface Community {
  id: string;
  community_number: number;
  collection_id: string;
  level: number;
  name: string;
  summary: string;
  findings: string[];
  rating: number;
  rating_explanation: string;
  embedding: number[];
  attributes: Record<string, any>;
}

export interface Triple {
  id?: number;
  subject: string;
  predicate: string;
  object: string;
  weight?: number;
  description?: string;
  predicate_embedding?: number[];
  extraction_ids: string[];
  documentIds: string[];
  attributes: Record<string, any>;
}

export interface DocumentFilterCriteria {
  sort: 'title' | 'date';
  order: 'asc' | 'desc';
}

export enum IngestionStatus {
  PENDING = 'pending',
  PARSING = 'parsing',
  EXTRACTING = 'extracting',
  CHUNKING = 'chunking',
  EMBEDDING = 'embedding',
  AUGMENTING = 'augmenting',
  STORING = 'storing',
  ENRICHING = 'enriching',
  FAILED = 'failed',
  SUCCESS = 'success',
}

export enum KGExtractionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
}

export interface DocumentInfoType {
  id: string;
  userId: string;
  collectionIds: string[];
  type: string;
  metadata: Record<string, any>;
  title: string;
  version: string;
  size_in_bytes: number;
  ingestionStatus: IngestionStatus;
  extractionStatus: KGExtractionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentInCollectionType {
  id: string;
  title: string;
  userId: string;
  documentType?: string;
  createdAt: string;
  updatedAt: string;
  ingestionStatus: IngestionStatus;
  extractionStatus: KGExtractionStatus;
  collectionIds: string[];
  metadata: Record<string, any>;
}

export interface DocumentInfoDialogProps {
  id: string;
  apiUrl?: string;
  open: boolean;
  onClose: () => void;
}

export interface DocumentChunk {
  extraction_id: string;
  documentId: string;
  userId: string;
  collectionIds: string[];
  text: string;
  metadata: { [key: string]: any };
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
  topP?: number;
  setTopP?: (value: number) => void;
  top_k?: number;
  setTop_k?: (value: number) => void;
  maxTokensToSample?: number;
  setmaxTokensToSample?: (value: number) => void;
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
  kg_topP?: number;
  setKgTopP?: (value: number) => void;
  kg_top_k?: number;
  setKgTop_k?: (value: number) => void;
  kg_maxTokensToSample?: number;
  setKgmaxTokensToSample?: (value: number) => void;
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
  role: 'user' | 'assistant';
  content: string;
  id: string;
  timestamp: number;
  sources?: {
    vector?: string | null;
    kg?: string | null;
  };
  isStreaming?: boolean;
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
  role: 'admin' | 'user';
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
  topP?: number;
  top_k?: number;
  maxTokensToSample?: number;
  model?: string;
  stream: boolean;
}

export interface SearchProps {
  pipeline?: Pipeline;
  setQuery: (query: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  switches: Record<
    string,
    { checked: boolean; label: string; tooltipText: string }
  >;
  handleSwitchChange: (id: string, checked: boolean) => void;
  searchLimit: number;
  setSearchLimit: (limit: number) => void;
  collections: Array<{ id: string; name: string }>;
  selectedCollectionIds: string[];
  setSelectedCollectionIds: React.Dispatch<React.SetStateAction<string[]>>;
  config: SidebarConfig;
  selectedModel?: string;
  onConversationSelect?: (conversationId: string) => void;

  // Vector search settings
  searchFilters: string;
  setSearchFilters: (filters: string) => void;
  indexMeasure?: string;
  setIndexMeasure: (measure: string) => void;
  includeMetadatas: boolean;
  setIncludeMetadatas: (value: boolean) => void;
  probes?: number;
  setProbes: (value: number) => void;
  efSearch?: number;
  setEfSearch: (value: number) => void;

  // Hybrid search settings
  fullTextWeight?: number;
  setFullTextWeight: (value: number) => void;
  semanticWeight?: number;
  setSemanticWeight: (value: number) => void;
  fullTextLimit?: number;
  setFullTextLimit: (value: number) => void;
  rrfK?: number;
  setRrfK: (value: number) => void;

  // KG search settings
  kgSearchLevel?: number | null;
  setKgSearchLevel: (value: number | null) => void;
  maxCommunityDescriptionLength?: number;
  setMaxCommunityDescriptionLength: (value: number) => void;
  localSearchLimits?: Record<string, number>;
  setLocalSearchLimits: (limits: Record<string, number>) => void;

  // RAG generation settings
  temperature?: number;
  setTemperature?: (temperature: number) => void;
  topP?: number;
  setTopP?: (topP: number) => void;
  topK?: number;
  setTopK?: (topK: number) => void;
  maxTokensToSample?: number;
  setMaxTokensToSample?: (maxTokens: number) => void;
}

export interface SidebarConfig {
  showVectorSearch: boolean;
  showKGSearch: boolean;
  showHybridSearch: boolean;
  showRagGeneration: boolean;
  showConversations?: boolean;
}

export interface SingleSwitchProps {
  id: string;
  initialChecked: boolean;
  onChange: (id: string, checked: boolean) => void;
  label: string;
  tooltipText?: string;
}

export interface Switch {
  checked: boolean;
  label: string;
  tooltipText: string;
}

export interface SpinnerProps {
  className?: string;
}

export interface UpdateButtonContainerProps {
  apiUrl?: string;
  id: string;
  onUpdateSuccess: () => void;
  showToast: (message: {
    title: string;
    description: string;
    variant: 'default' | 'destructive' | 'success';
  }) => void;
}

export interface UpdateButtonProps {
  userId: string;
  id: string;
  onUpdateSuccess: () => void;
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
  ) => Promise<{ success: boolean; userRole: 'admin' | 'user' }>;
  loginWithToken: (
    token: string,
    instanceUrl: string
  ) => Promise<{ success: boolean; userRole: 'admin' | 'user' }>;
  logout: () => Promise<void>;
  unsetCredentials: () => Promise<void>;
  register: (
    email: string,
    password: string,
    instanceUrl: string
  ) => Promise<void>;
  authState: AuthState;
  getClient: () => r2rClient | null;
  client: r2rClient | null;
  viewMode: 'admin' | 'user';
  setViewMode: React.Dispatch<React.SetStateAction<'admin' | 'user'>>;
  isSuperUser: () => boolean;
  createUser: (userData: {
    email: string;
    password: string;
    role: string;
  }) => Promise<any>;
  deleteUser: (userId: string, password: string) => Promise<any>;
  updateUser: (
    userId: string,
    userData: { email: string; role: string },
    name?: string,
    bio?: string,
    is_superuser?: boolean
  ) => Promise<any>;
}

export type CreateUserRequest = {
  email: string;
  password: string;
  role: 'admin' | 'user';
};

export type User = {
  id: string;
  email: string;
  role: 'admin' | 'user';
};

export type Collection = {
  name: string;
  id: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Graph = {
  name: string;
  id: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
};

export interface VectorSearchResult {
  document_id: string;
  userId: string;
  collectionIds: string[];
  score: number;
  text: string;
  metadata: Record<string, any>;
}

export interface KGEntity {
  name: string;
  description: string;
}

export interface KGTriple {
  subject: string;
  predicate: string;
  object: string;
}

export interface KGCommunity {
  title: string;
  summary: string;
  explanation: string;
}

export interface KGLocalSearchResult {
  query: string;
  entities: KGEntity[];
  relationships: KGTriple[];
  communities: KGCommunity[];
}

export interface KGSearchResult {
  method: 'local' | 'global';
  content: any;
  result_type: 'entity' | 'relationship' | 'community' | 'global';
  documentIds: string[];
  metadata: Record<string, any>;
}
