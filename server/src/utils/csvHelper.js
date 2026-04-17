/**
 * Convert an array of objects to CSV string.
 * @param {Array<Object>} data - Array of row objects
 * @param {Array<{key: string, label: string, transform?: Function}>} columns - Column definitions
 * @returns {string} CSV content
 */
export const generateCSV = (data, columns) => {
  const header = columns.map(col => `"${col.label}"`).join(',');

  const rows = data.map(row =>
    columns.map(col => {
      let value = col.transform ? col.transform(row) : row[col.key];
      if (value === null || value === undefined) value = '';
      // Escape double quotes and wrap in quotes
      const str = String(value).replace(/"/g, '""');
      return `"${str}"`;
    }).join(',')
  );

  return [header, ...rows].join('\r\n');
};

/**
 * Send CSV response with appropriate headers.
 * @param {Object} res - Express response object
 * @param {string} csv - CSV content string
 * @param {string} filename - Download filename
 */
export const sendCSVResponse = (res, csv, filename) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.status(200).send(csv);
};
