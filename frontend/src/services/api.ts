import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import type {
  ChatRequest,
  ChatResponse,
  ApproveRequest,
  ApproveResponse,
} from '@/types';

/**
 * API client configuration
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor
 */
apiClient.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent cache
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }

    // Can add token here
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }

    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 */
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error: AxiosError) => {
    // Unified error handling
    if (error.response) {
      // Server returns error status code
      const { status, data } = error.response;
      console.error(`API Error ${status}:`, data);

      switch (status) {
        case 400:
          throw new Error('Request parameter error');
        case 401:
          throw new Error('Unauthorized, please login again');
        case 403:
          throw new Error('Access denied');
        case 404:
          throw new Error('The requested resource does not exist');
        case 500:
          throw new Error('Server error, please try again later');
        default:
          throw new Error(`Request failed: ${status}`);
      }
    } else if (error.request) {
      // Request sent but no response received
      console.error('Network Error:', error.message);
      throw new Error('Network error, please check your network connection');
    } else {
      // Request configuration error
      console.error('Request Config Error:', error.message);
      throw new Error('Request configuration error');
    }
  }
);

/**
 * Request retry configuration
 */
interface RetryConfig extends AxiosRequestConfig {
  retry?: number;
  retryDelay?: number;
}

/**
 * Request function with retry
 */
const requestWithRetry = async <T>(
  requestFn: () => Promise<T>,
  maxRetries = 3,
  retryDelay = 1000
): Promise<T> => {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Request failed, retry ${i + 1}/${maxRetries}`, error);

      if (i < maxRetries - 1) {
        // Wait and retry
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  throw lastError;
};

/**
 * API service layer
 * Encapsulate all communication with the backend
 */
export const apiService = {
  /**
  * Send chat message or upload receipt
   * Use FormData format to send files
   */
  sendMessage: async (data: {
    text: string;
    files?: File[];
    session_id: string;
    user_id: string;
  }): Promise<ChatResponse> => {
    try {
      const formData = new FormData();
      formData.append('text', data.text);
      formData.append('session_id', data.session_id);
      formData.append('user_id', data.user_id);
      
      // Add files (if any)
      if (data.files && data.files.length > 0) {
        data.files.forEach((file) => {
          formData.append('files', file);
        });
      }
  
        // Add query parameter for Postman Mock matching
      const hasFiles = data.files && data.files.length > 0;
      const url = `/chat?has_file=${hasFiles}`;
  
      const response = await requestWithRetry(
        () => apiClient.post<ChatResponse>(url, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }),
        2 // Maximum 2 retries
      );
      return response.data;
    } catch (error) {
      console.error('Send message failed:', error);
      throw error;
    }
  },

  /**
   * Approve receipt information
   */
  approveReceipt: async (
    request: ApproveRequest
  ): Promise<ApproveResponse> => {
    try {
      const response = await requestWithRetry(
        () => apiClient.post<ApproveResponse>('/approve', request),
        2
      );
      return response.data;
    } catch (error) {
      console.error('Approve receipt failed:', error);
      throw error;
    }
  },
};

export default apiClient;

