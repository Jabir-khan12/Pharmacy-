import api from '../config/api';
import toast from 'react-hot-toast';

/**
 * Download a CSV file from an API export endpoint.
 * @param {string} endpoint - API endpoint path (e.g., '/export/sales')
 * @param {Object} params - Query parameters
 * @param {string} fallbackFilename - Fallback filename if not provided by server
 */
export const downloadCSV = async (endpoint, params = {}, fallbackFilename = 'export.csv') => {
  try {
    const response = await api.get(endpoint, {
      params,
      responseType: 'blob'
    });

    // Extract filename from Content-Disposition header if available
    const disposition = response.headers['content-disposition'];
    let filename = fallbackFilename;
    if (disposition) {
      const match = disposition.match(/filename="?([^";\n]+)"?/);
      if (match) filename = match[1];
    }

    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success('Export downloaded successfully');
  } catch (error) {
    toast.error('Failed to download export');
    console.error('CSV export error:', error);
  }
};
