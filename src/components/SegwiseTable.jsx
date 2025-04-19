import { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function SegwiseTable({ filteredData }) {
  const [sortField, setSortField] = useState('impressions');
  const [sortDirection, setSortDirection] = useState('desc');
  const [visibleColumns, setVisibleColumns] = useState({
    creative_name: true,
    campaign: true,
    ad_group: true,
    country: true,
    ipm: true,
    ctr: true,
    spend: true,
    impressions: true,
    installs: true,
  });
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [hoverRow, setHoverRow] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Sort data
  const sortedData = useMemo(() => {
    if (!filteredData) return [];

    return [...filteredData].sort((a, b) => {
      // Handle numeric fields
      if (typeof a[sortField] === 'number') {
        return sortDirection === 'asc'
          ? a[sortField] - b[sortField]
          : b[sortField] - a[sortField];
      }
      // Handle string fields
      return sortDirection === 'asc'
        ? a[sortField]?.localeCompare(b[sortField] || '')
        : b[sortField]?.localeCompare(a[sortField] || '');
    });
  }, [filteredData, sortField, sortDirection]);

  // Calculate pagination
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return sortedData.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedData, currentPage, rowsPerPage]);

  // Handle pagination
  const goToPage = (page) => {
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    setCurrentPage(page);
  };

  // Handle sort click
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Toggle column visibility
  const toggleColumn = (column) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing rows per page
  };

  // Get sort icon
  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown size={14} className="ml-1 text-gray-400" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp size={14} className="ml-1 text-green-600" />
    ) : (
      <ChevronDown size={14} className="ml-1 text-green-600" />
    );
  };

  const columns = [
    { field: 'creative_name', header: 'Creative Name' },
    { field: 'campaign', header: 'Campaign' },
    { field: 'ad_group', header: 'Ad Group' },
    { field: 'country', header: 'Country' },
    {
      field: 'ipm',
      header: 'IPM',
      format: (val) => (parseFloat(val) || 0).toFixed(2),
    },
    {
      field: 'ctr',
      header: 'CTR',
      format: (val) => (parseFloat(val) || 0).toFixed(2) + '%',
    },
    {
      field: 'spend',
      header: 'Spend',
      format: (val) => '$' + (parseFloat(val) || 0).toFixed(2),
    },
    {
      field: 'impressions',
      header: 'Impressions',
      format: (val) => parseInt(val) || 0,
    },
    {
      field: 'installs',
      header: 'Installs',
      format: (val) => parseInt(val) || 0,
    },
  ];

  // Get visible columns
  const visibleColumnsList = columns.filter((col) => visibleColumns[col.field]);

  // Get color based on value for metrics (higher is better)
  const getMetricColor = (field, value) => {
    if (!value || value === 0) return 'text-gray-500';

    // For CTR, IPM, higher values are good
    if (field === 'ctr' || field === 'ipm') {
      if (value > 1.5) return 'text-green-700 font-medium';
      if (value > 0.8) return 'text-green-600';
      return 'text-orange-600';
    }

    // For installs
    if (field === 'installs') {
      if (value > 20) return 'text-green-700 font-medium';
      if (value > 10) return 'text-green-600';
      return 'text-orange-600';
    }

    // For spend, lower is better
    if (field === 'spend') {
      if (value < 3) return 'text-green-600';
      if (value < 5) return 'text-orange-600';
      return 'text-red-600';
    }

    return 'text-gray-900';
  };

  return (
    <div className="bg-white rounded-lg shadow mb-4 overflow-hidden border border-gray-200">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-800">
          Campaign Performance
        </h2>

        <div className="relative">
          <button
            onClick={() => setShowColumnSelector(!showColumnSelector)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 flex items-center"
          >
            {showColumnSelector ? (
              <EyeOff size={14} className="mr-1.5" />
            ) : (
              <Eye size={14} className="mr-1.5" />
            )}
            Columns
          </button>

          {showColumnSelector && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-md shadow-lg z-10 border border-gray-200 w-48">
              <div className="p-2 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase">
                Toggle Columns
              </div>
              {columns.map((column) => (
                <div
                  key={column.field}
                  className="flex items-center px-3 py-2 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    id={`col-${column.field}`}
                    checked={visibleColumns[column.field]}
                    onChange={() => toggleColumn(column.field)}
                    className="mr-2 h-4 w-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <label
                    htmlFor={`col-${column.field}`}
                    className="text-sm cursor-pointer"
                  >
                    {column.header}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {visibleColumnsList.map((column) => (
                <th
                  key={column.field}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort(column.field)}
                >
                  <div className="flex items-center">
                    {column.header}
                    {getSortIcon(column.field)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((item, index) => (
              <tr
                key={index}
                className={`${
                  hoverRow === index
                    ? 'bg-[#E3FA99] bg-opacity-30'
                    : 'hover:bg-gray-50'
                } transition duration-150`}
                onMouseEnter={() => setHoverRow(index)}
                onMouseLeave={() => setHoverRow(null)}
              >
                {visibleColumnsList.map((column) => (
                  <td
                    key={column.field}
                    className={`px-6 py-4 whitespace-nowrap text-sm ${getMetricColor(
                      column.field,
                      item[column.field]
                    )}`}
                  >
                    {column.format
                      ? column.format(item[column.field])
                      : item[column.field]}
                  </td>
                ))}
              </tr>
            ))}

            {(!paginatedData || paginatedData.length === 0) && (
              <tr>
                <td
                  colSpan={visibleColumnsList.length}
                  className="px-6 py-10 text-center text-sm text-gray-500 bg-gray-50 italic"
                >
                  No results found
                </td>
              </tr>
            )}
          </tbody>

          {sortedData && sortedData.length > 0 && (
            <tfoot className="bg-gray-50 border-t border-gray-200">
              <tr>
                {visibleColumnsList.map((column, idx) => {
                  // Calculate totals for numeric columns
                  if (
                    ['impressions', 'clicks', 'installs'].includes(column.field)
                  ) {
                    const total = sortedData.reduce(
                      (sum, item) => sum + (parseInt(item[column.field]) || 0),
                      0
                    );
                    return (
                      <td
                        key={idx}
                        className="px-6 py-3 text-sm font-medium text-gray-700"
                      >
                        {column.field === 'impressions'
                          ? `Total: ${total.toLocaleString()}`
                          : total.toLocaleString()}
                      </td>
                    );
                  }

                  // Show average for rates
                  if (['ipm', 'ctr'].includes(column.field)) {
                    const sum = sortedData.reduce(
                      (sum, item) =>
                        sum + (parseFloat(item[column.field]) || 0),
                      0
                    );
                    const avg =
                      sortedData.length > 0 ? sum / sortedData.length : 0;
                    return (
                      <td
                        key={idx}
                        className="px-6 py-3 text-sm font-medium text-gray-700"
                      >
                        {`Avg: ${avg.toFixed(2)}${
                          column.field === 'ctr' ? '%' : ''
                        }`}
                      </td>
                    );
                  }

                  // Show total spend
                  if (column.field === 'spend') {
                    const total = sortedData.reduce(
                      (sum, item) =>
                        sum + (parseFloat(item[column.field]) || 0),
                      0
                    );
                    return (
                      <td
                        key={idx}
                        className="px-6 py-3 text-sm font-medium text-gray-700"
                      >
                        {`Total: $${total.toFixed(2)}`}
                      </td>
                    );
                  }

                  // Empty cell for non-numeric columns
                  return <td key={idx} className="px-6 py-3"></td>;
                })}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center">
          <span className="text-sm text-gray-700 mr-2">Rows per page:</span>
          <select
            value={rowsPerPage}
            onChange={handleRowsPerPageChange}
            className="text-sm border border-gray-300 rounded p-1 bg-white"
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className="text-sm text-gray-500">
          Showing{' '}
          {paginatedData.length ? (currentPage - 1) * rowsPerPage + 1 : 0}-
          {Math.min(currentPage * rowsPerPage, sortedData.length)} of{' '}
          {sortedData.length} results
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
          </button>

          {totalPages <= 7 ? (
            // Show all pages if 7 or fewer
            Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`px-3 py-1 text-sm rounded-md ${
                  currentPage === page
                    ? 'bg-[#E3FA99] text-green-800 font-medium border border-green-300'
                    : 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
                }`}
              >
                {page}
              </button>
            ))
          ) : (
            // Show limited pages with ellipsis for many pages
            <>
              {/* First page */}
              <button
                onClick={() => goToPage(1)}
                className={`px-3 py-1 text-sm rounded-md ${
                  currentPage === 1
                    ? 'bg-[#E3FA99] text-green-800 font-medium border border-green-300'
                    : 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
                }`}
              >
                1
              </button>

              {/* Ellipsis or second page */}
              {currentPage > 3 && <span className="px-2">...</span>}

              {/* Pages around current page */}
              {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                let page;
                if (currentPage <= 3) {
                  page = i + 2;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 1 + i;
                }
                return page > 1 && page < totalPages ? (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-3 py-1 text-sm rounded-md ${
                      currentPage === page
                        ? 'bg-[#E3FA99] text-green-800 font-medium border border-green-300'
                        : 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {page}
                  </button>
                ) : null;
              })}

              {/* Ellipsis or second-to-last page */}
              {currentPage < totalPages - 2 && (
                <span className="px-2">...</span>
              )}

              {/* Last page */}
              <button
                onClick={() => goToPage(totalPages)}
                className={`px-3 py-1 text-sm rounded-md ${
                  currentPage === totalPages
                    ? 'bg-[#E3FA99] text-green-800 font-medium border border-green-300'
                    : 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
                }`}
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-1 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
